import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "antd";

import DrawWinLine from "../winLine";
import Point from "../scripts/TicTacToe/Point";

import {
  gameStart,
  makeTurn,
  getCurrentUser,
  TicTacToeSocket,
  type GameStartResponse,
  type CurrentUserResponse,
  type OpponentInfo,
  type WsMessage,
} from "../../ticTacToeApi";

import styles from "./styles";
import type { OnlinePhase, OnlineBoard } from "./types";

// ─── Хелпер: победная линия ───────────────────────────────────────────────────

function findWinningLineOnline(board: OnlineBoard, winnerId: number, size: number): Point[] | null {
  const b = board;
  for (let r = 0; r < size; r++) {
    if (b[r].every(c => c === winnerId)) return b[r].map((_, col) => new Point(r, col));
  }
  for (let col = 0; col < size; col++) {
    if (b.every(row => row[col] === winnerId)) return b.map((_, r) => new Point(r, col));
  }
  if (b.every((row, i) => row[i] === winnerId)) return b.map((_, i) => new Point(i, i));
  if (b.every((row, i) => row[size - 1 - i] === winnerId)) return b.map((_, i) => new Point(i, size - 1 - i));
  return null;
}

// ─── Карточка игрока ──────────────────────────────────────────────────────────

const PlayerCard: React.FC<{
  user: CurrentUserResponse | OpponentInfo | null;
  label: string;
  symbol: "X" | "O";
  active: boolean;
  phase: OnlinePhase;
}> = ({ user, label, symbol, active, phase }) => (
  <div style={{ ...styles.playerCard, border: active ? "2px solid #1677ff" : "2px solid #ddd" }}>
    <div style={styles.avatar}>
      {user?.avatar
        ? <img src={user.avatar} alt="avatar" style={{ width: 48, height: 48, borderRadius: "50%" }} />
        : <span style={{ fontSize: 28 }}>{symbol === "X" ? "❌" : "⭕"}</span>
      }
    </div>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 12, color: "#888" }}>
        {user
          ? user.email
          : (["waiting", "joining"].includes(phase) ? "ожидание..." : "—")}
      </div>
    </div>
  </div>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface OnlineGameProps {
  onExit: () => void;
  onError: (msg: string) => void;
}

// ─── Компонент ───────────────────────────────────────────────────────────────

const OnlineGame: React.FC<OnlineGameProps> = ({ onExit, onError }) => {
  const ONLINE_CELL = 120;

  const [phase, setPhase]               = useState<OnlinePhase>("searching");
  const [lobbyId, setLobbyId]           = useState<number | null>(null);
  const [board, setBoard]               = useState<OnlineBoard>(Array.from({ length: 3 }, () => Array(3).fill(null)));
  const [isMyTurn, setIsMyTurn]         = useState(false);
  const [myUser, setMyUser]             = useState<CurrentUserResponse | null>(null);
  const [opponent, setOpponent]         = useState<OpponentInfo | null>(null);
  const [winnerId, setWinnerId]         = useState<number | null | undefined>(undefined);
  const [winningLine, setWinningLine]   = useState<Point[] | null>(null);
  const [isMakingMove, setIsMakingMove] = useState(false);
  const [turnDeadline, setTurnDeadline] = useState<number | null>(null);
  const [timeLeft, setTimeLeft]         = useState<number | null>(null);
  const [localError, setLocalError]     = useState<string | null>(null);

  const socketRef  = useRef<TicTacToeSocket | null>(null);
  const lobbyIdRef = useRef<number | null>(null);

  // ── Загрузка данных текущего пользователя ────────────────────────────────
  useEffect(() => {
    getCurrentUser().then(setMyUser).catch(() => {});
  }, []);

  // ── Очистка WS при размонтировании ───────────────────────────────────────
  useEffect(() => {
    return () => { socketRef.current?.disconnect(); };
  }, []);

  // ── Таймер хода (timestamp из make_turn) ─────────────────────────────────
  useEffect(() => {
    if (turnDeadline === null) { setTimeLeft(null); return; }
    const tick = () => setTimeLeft(Math.max(0, turnDeadline - Math.floor(Date.now() / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [turnDeadline]);

  // ── Обработчик WS-сообщений ──────────────────────────────────────────────

  /**
   * found_opponent → Шаг 4: найден соперник. Переключаемся на WS /get_turn/.
   * get_turn       → Шаг 6: ход соперника. Шаг 7: проверка game_over.
   * game_ended     → Шаг 8: игра завершена сервером.
   * lobby_state    → Шаг 3: восстановление состояния при rejoin.
   */
  const handleWsMessage = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case "found_opponent": {
        setOpponent(msg.opponent);
        if (msg.map) setBoard(msg.map);
        setIsMyTurn(msg.is_your_turn);
        setPhase("playing");
        // Переключаемся с found_opponent → get_turn
        socketRef.current?.disconnect();
        const id = lobbyIdRef.current!;
        const sock = new TicTacToeSocket(id, "get_turn", handleWsMessage);
        sock.connect();
        socketRef.current = sock;
        break;
      }
      case "get_turn": {
        setBoard(msg.map);
        setIsMyTurn(msg.is_your_turn);
        setTurnDeadline(null);
        if (msg.game_over) {
          setWinnerId(msg.winner);
          if (msg.winner && msg.winner !== 0)
            setWinningLine(findWinningLineOnline(msg.map, msg.winner, 3));
          setPhase("finished");
        }
        break;
      }
      case "game_ended": {
        setBoard(msg.map);
        setWinnerId(msg.winner);
        if (msg.winner && msg.winner !== 0)
          setWinningLine(findWinningLineOnline(msg.map, msg.winner, 3));
        setPhase("finished");
        break;
      }
      case "lobby_state": {
        setBoard(msg.map);
        setIsMyTurn(msg.is_your_turn);
        break;
      }
    }
  }, []);

  // ── Шаг 1–4: запуск онлайн-игры ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let data: GameStartResponse;
      try {
        data = await gameStart(3, 3);
      } catch (e: any) {
        if (!cancelled) {
          onError(e.message ?? "Ошибка подключения к серверу");
          onExit();
        }
        return;
      }
      if (cancelled) return;

      setLobbyId(data.lobby_id);
      lobbyIdRef.current = data.lobby_id;
      setBoard(data.map);

      // Шаг 3: rejoin
      if (data.status === "rejoined") {
        if (data.opponent) setOpponent(data.opponent);
        if (data.is_your_turn !== null) setIsMyTurn(data.is_your_turn);
        const sock = new TicTacToeSocket(data.lobby_id, "get_turn", handleWsMessage);
        sock.connect();
        socketRef.current = sock;
        setPhase("playing");
        return;
      }

      // Шаг 4: joined — найдено открытое лобби
      if (data.status === "joined") {
        setPhase("joining");
        if (data.opponent) setOpponent(data.opponent);
        if (data.is_your_turn !== null) setIsMyTurn(data.is_your_turn);
        const sock = new TicTacToeSocket(data.lobby_id, "found_opponent", handleWsMessage);
        sock.connect();
        socketRef.current = sock;
        return;
      }

      // Шаг 4: created — ждём соперника
      setPhase("waiting");
      const sock = new TicTacToeSocket(data.lobby_id, "found_opponent", handleWsMessage);
      sock.connect();
      socketRef.current = sock;
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Шаг 5: совершение хода ───────────────────────────────────────────────
  const handleCellClick = useCallback(async (row: number, col: number) => {
    if (!isMyTurn || phase !== "playing" || isMakingMove) return;
    if (board[row][col] !== null || !lobbyId) return;

    setIsMakingMove(true);
    try {
      const res = await makeTurn(lobbyId, row, col);
      setBoard(res.map);
      setTurnDeadline(res.timestamp + 120);

      // Шаг 7: проверка завершения
      if (res.game_over) {
        setWinnerId(res.winner);
        if (res.winner && res.winner !== 0)
          setWinningLine(findWinningLineOnline(res.map, res.winner, 3));
        setPhase("finished");
      } else {
        setIsMyTurn(false);
      }
    } catch (e: any) {
      setLocalError(e.message ?? "Ошибка при ходе");
    } finally {
      setIsMakingMove(false);
    }
  }, [isMyTurn, phase, isMakingMove, board, lobbyId]);

  // ── Выход / сброс ────────────────────────────────────────────────────────
  const handleExit = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    onExit();
  }, [onExit]);

  // ── Вспомогательные функции ───────────────────────────────────────────────
  const getCellSymbol = (cell: number | null) => {
    if (cell === null) return "";
    return myUser && cell === myUser.id ? "X" : "O";
  };

  const getCellColor = (cell: number | null) => {
    if (cell === null) return "#fff";
    return myUser && cell === myUser.id ? "#e8f4ff" : "#fff0f0";
  };

  const statusText = (): string => {
    switch (phase) {
      case "searching":  return "🔍 Подключаемся...";
      case "waiting":    return "⏳ Ожидаем соперника...";
      case "joining":    return "🔗 Присоединяемся к игре...";
      case "rejoining":  return "🔄 Восстанавливаем игру...";
      case "playing":
        if (isMyTurn) return "✅ Ваш ход";
        return timeLeft !== null ? `⏱ Ход соперника — осталось ${timeLeft}с` : "⏳ Ход соперника...";
      case "finished":
        if (winnerId === 0 || winnerId === null) return "🤝 Ничья!";
        if (winnerId === undefined) return "";
        return myUser && winnerId === myUser.id ? "🎉 Вы победили!" : "😔 Вы проиграли";
    }
  };

  const statusColor = phase === "finished"
    ? (winnerId === 0 || winnerId === null ? "#888"
      : myUser && winnerId === myUser.id ? "#22a06b" : "#e34935")
    : undefined;

  const boardDisabled = ["searching", "waiting", "joining", "rejoining"].includes(phase);

  // ── Рендер ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      <h2 style={{ marginBottom: 8 }}>🌐 Крестики-нолики — Онлайн</h2>

      {localError && (
        <div style={styles.errorBox}>
          ⚠️ {localError}
          <button onClick={() => setLocalError(null)} style={styles.closeBtn}>×</button>
        </div>
      )}

      {/* Карточки игроков */}
      <div style={styles.players}>
        <PlayerCard user={myUser}     label="Вы"       symbol="X" active={isMyTurn  && phase === "playing"} phase={phase} />
        <div style={{ fontSize: 24, alignSelf: "center" }}>VS</div>
        <PlayerCard user={opponent}   label="Соперник" symbol="O" active={!isMyTurn && phase === "playing"} phase={phase} />
      </div>

      {/* Статус */}
      <p style={{ ...styles.status, color: statusColor }}>{statusText()}</p>

      {/* Поле */}
      <div style={{ position: "relative", display: "inline-block", opacity: boardDisabled ? 0.5 : 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(3, ${ONLINE_CELL}px)`, gap: 8 }}>
          {board.flat().map((cell, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const clickable = isMyTurn && phase === "playing" && cell === null && !isMakingMove;
            return (
              <div
                key={i}
                onClick={() => clickable && handleCellClick(row, col)}
                style={{
                  width: ONLINE_CELL,
                  height: ONLINE_CELL,
                  border: "2px solid #333",
                  borderRadius: 8,
                  fontSize: Math.floor(ONLINE_CELL * 0.55),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: clickable ? "pointer" : "default",
                  background: getCellColor(cell),
                  userSelect: "none",
                  boxShadow: "0 3px 6px rgba(0,0,0,0.12)",
                  transition: "background 0.15s",
                }}
              >
                {getCellSymbol(cell)}
              </div>
            );
          })}
        </div>

        {winningLine && (
          <DrawWinLine
            winningLine={winningLine}
            size={3}
            cellSize={ONLINE_CELL}
            gap={8}
            strokeWidth={4}
            stroke="red"
            strokeLinecap="round"
          />
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <Button onClick={handleExit} danger={phase === "playing"}>
          {phase === "finished" ? "Играть снова" : "Выйти из игры"}
        </Button>
      </div>
    </div>
  );
};

export default OnlineGame;
