import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, Select } from "antd";

import TicTacToeGame from "./scripts/TicTacToe/TicTacToeGame";
import TicTacToePlayer from "./scripts/TicTacToe/TicTacToePlayer";
import WinnerChecker from "./scripts/TicTacToe/WinnerChecker";
import TicTacToeBot from "./scripts/TicTacToe/TicTacToeBot";
import TicTacToeChars from "./scripts/TicTacToe/TicTacToeCharsEnum";
import Point from "./scripts/TicTacToe/Point";
import GameStates from "./scripts/TicTacToe/TicTacToeGameStates";
import DrawWinLine from "./winLine";

import {
  gameStart,
  makeTurn,
  deleteLobby,
  getCurrentUser,
  TicTacToeSocket,
  type GameStartResponse,
  type CurrentUserResponse,
  type OpponentInfo,
  type WsMessage,
} from "../ticTacToeApi";

type Mode = "menu" | "local" | "online_settings" | "online";
type OnlinePhase = "searching" | "waiting" | "playing" | "finished";
type OnlineBoard = (number | null)[][];

function findWinningLineOnline(board: OnlineBoard, winnerId: number, size: number, winLen: number): Point[] | null {
  const b = board;
  // ряды
  for (let r = 0; r < size; r++)
    for (let c = 0; c <= size - winLen; c++)
      if (Array.from({length: winLen}, (_, k) => b[r][c+k]).every(v => v === winnerId))
        return Array.from({length: winLen}, (_, k) => new Point(r, c+k));
  // столбцы
  for (let c = 0; c < size; c++)
    for (let r = 0; r <= size - winLen; r++)
      if (Array.from({length: winLen}, (_, k) => b[r+k][c]).every(v => v === winnerId))
        return Array.from({length: winLen}, (_, k) => new Point(r+k, c));
  // диагональ \
  for (let r = 0; r <= size - winLen; r++)
    for (let c = 0; c <= size - winLen; c++)
      if (Array.from({length: winLen}, (_, k) => b[r+k][c+k]).every(v => v === winnerId))
        return Array.from({length: winLen}, (_, k) => new Point(r+k, c+k));
  // диагональ /
  for (let r = 0; r <= size - winLen; r++)
    for (let c = winLen-1; c < size; c++)
      if (Array.from({length: winLen}, (_, k) => b[r+k][c-k]).every(v => v === winnerId))
        return Array.from({length: winLen}, (_, k) => new Point(r+k, c-k));
  return null;
}

const TicTacToe: React.FC = () => {
  const [mode, setMode] = useState<Mode>("menu");

  // ── Локальная игра ──────────────────────────────────────────────────────
  const [pendingSize, setPendingSize] = useState(3);
  const [pendingWinLength, setPendingWinLength] = useState(3);
  const [vsBot, setVsBot] = useState(false);
  const [size, setSize] = useState(3);
  const [winLength, setWinLength] = useState(3);
  const [game, setGame] = useState<TicTacToeGame>();
  const [playerX, setPlayerX] = useState<TicTacToePlayer>();
  const [playerO, setPlayerO] = useState<TicTacToePlayer>();
  const [bot, setBot] = useState<TicTacToeBot>();
  const [currentPlayer, setCurrentPlayer] = useState<TicTacToePlayer>();
  const [board, setBoard] = useState<TicTacToeChars[]>([]);
  const [winningLine, setWinningLine] = useState<Point[] | null>(null);
  const cellSize = Math.max(50, Math.floor(480 / size));

  // ── Онлайн — настройки ─────────────────────────────────────────────────
  const [pendingOnlineSize, setPendingOnlineSize] = useState(3);
  const [pendingOnlineWinLen, setPendingOnlineWinLen] = useState(3);

  // ── Онлайн — игра ──────────────────────────────────────────────────────
  const [onlinePhase, setOnlinePhase] = useState<OnlinePhase>("searching");
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [lobbyId, setLobbyId] = useState<number | null>(null);
  const [isLobbyOwner, setIsLobbyOwner] = useState(false);
  const [mySymbol, setMySymbol] = useState<"X"|"O">("X");
  const [onlineSize, setOnlineSize] = useState(3);
  const [onlineWinLen, setOnlineWinLen] = useState(3);
  const [onlineBoard, setOnlineBoard] = useState<OnlineBoard>(Array.from({length:3},()=>Array(3).fill(null)));
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [myUser, setMyUser] = useState<CurrentUserResponse | null>(null);
  const [opponent, setOpponent] = useState<OpponentInfo | null>(null);
  const [onlineWinnerId, setOnlineWinnerId] = useState<number | null | undefined>(undefined);
  const [onlineWinningLine, setOnlineWinningLine] = useState<Point[] | null>(null);
  const [isMakingMove, setIsMakingMove] = useState(false);
  const [turnDeadline, setTurnDeadline] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const socketRef = useRef<TicTacToeSocket | null>(null);
  const lobbyIdRef = useRef<number | null>(null);
  const onlineSizeRef = useRef(3);
  const onlineWinLenRef = useRef(3);

  useEffect(() => {
    if (turnDeadline === null) { setTimeLeft(null); return; }
    const tick = () => setTimeLeft(Math.max(0, turnDeadline - Math.floor(Date.now() / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [turnDeadline]);

  useEffect(() => { getCurrentUser().then(setMyUser).catch(() => {}); }, []);
  useEffect(() => { return () => { socketRef.current?.disconnect(); }; }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // ЛОКАЛЬНАЯ ИГРА
  // ═══════════════════════════════════════════════════════════════════════

  const findWinningLineLocal = (field: TicTacToeChars[][], symbol: TicTacToeChars, wl: number, s: number): Point[] | null => {
    for (let row = 0; row < s; row++)
      for (let col = 0; col <= s - wl; col++)
        if (Array.from({length:wl},(_,k)=>field[row][col+k]).every(c=>c===symbol))
          return Array.from({length:wl},(_,k)=>new Point(row,col+k));
    for (let col = 0; col < s; col++)
      for (let row = 0; row <= s - wl; row++)
        if (Array.from({length:wl},(_,k)=>field[row+k][col]).every(c=>c===symbol))
          return Array.from({length:wl},(_,k)=>new Point(row+k,col));
    for (let row = 0; row <= s - wl; row++)
      for (let col = 0; col <= s - wl; col++)
        if (Array.from({length:wl},(_,k)=>field[row+k][col+k]).every(c=>c===symbol))
          return Array.from({length:wl},(_,k)=>new Point(row+k,col+k));
    for (let row = 0; row <= s - wl; row++)
      for (let col = wl-1; col < s; col++)
        if (Array.from({length:wl},(_,k)=>field[row+k][col-k]).every(c=>c===symbol))
          return Array.from({length:wl},(_,k)=>new Point(row+k,col-k));
    return null;
  };

  const initGame = (newSize: number, newWinLength: number, playVsBot: boolean) => {
    const allowBot = newSize === 3;
    const useBot = playVsBot && allowBot;
    const newField = Array.from({length:newSize},()=>Array(newSize).fill(TicTacToeChars.empty));
    const checker = new WinnerChecker(newWinLength);
    const newGame = new TicTacToeGame(newField, newWinLength, checker);
    const pX = new TicTacToePlayer(TicTacToeChars.cross, newGame, "X");
    let pO: TicTacToePlayer;
    let botInstance: TicTacToeBot | undefined;
    if (useBot) {
      pO = new TicTacToePlayer(TicTacToeChars.circle, newGame, "Бот");
      botInstance = new TicTacToeBot(newGame, TicTacToeChars.circle, checker, pX);
    } else {
      pO = new TicTacToePlayer(TicTacToeChars.circle, newGame, "O");
    }
    setGame(newGame); setPlayerX(pX); setPlayerO(pO); setBot(botInstance);
    setCurrentPlayer(pX); setBoard(newField.flat()); setWinningLine(null);
    setSize(newSize); setWinLength(newWinLength);
    if (!allowBot) setVsBot(false);
  };

  useEffect(() => {
    if (mode !== "local") return;
    if (!vsBot || !bot || currentPlayer !== playerO || game?.isGameOver) return;
    const timeout = setTimeout(() => {
      if (bot && game && !game.isGameOver) {
        const bestMove = bot.findBestMove();
        playerO!.makeMove(bestMove);
        bot.saveMove(`${bestMove.row},${bestMove.column}`);
        setBoard(game.getFieldCopy().flat());
        setCurrentPlayer(playerX);
      }
    }, 450);
    return () => clearTimeout(timeout);
  }, [mode, vsBot, bot, currentPlayer, game, playerX, playerO]);

  const handleLocalClick = (index: number) => {
    if (!game || game.isGameOver || !currentPlayer) return;
    if (vsBot && currentPlayer === playerO) return;
    const row = Math.floor(index / size);
    const col = index % size;
    if (board[index] !== TicTacToeChars.empty) return;
    currentPlayer.makeMove(new Point(row, col));
    setBoard(game.getFieldCopy().flat());
    setCurrentPlayer(currentPlayer === playerX ? playerO : playerX);
  };

  useEffect(() => {
    if (mode !== "local") return;
    if (game && game.isGameOver && game.gameState === GameStates.hasWinner && !winningLine) {
      const line = findWinningLineLocal(game.field, game.getWinner().value, winLength, size);
      setWinningLine(line);
    }
  }, [mode, board, game, winLength, size, winningLine]);

  const startNewGame = () => {
    const newS = pendingSize;
    const newW = Math.min(pendingWinLength, newS);
    initGame(newS, newW, vsBot && newS === 3);
    setPendingWinLength(newW);
  };

  const isOver = game?.isGameOver ?? false;
  const hasWinner = isOver && game?.gameState === GameStates.hasWinner;
  const winner = hasWinner ? game?.getWinner() : null;
  const getPlayerName = (p: TicTacToePlayer | undefined) => p?.name ?? "?";
  const localStatus = isOver ? (winner ? `Победитель: ${getPlayerName(winner)}` : "Ничья") : `Ход: ${getPlayerName(currentPlayer)}`;
  const getSymbol = (cell: TicTacToeChars) => cell === TicTacToeChars.cross ? "X" : cell === TicTacToeChars.circle ? "O" : "";

  // ═══════════════════════════════════════════════════════════════════════
  // ОНЛАЙН-ИГРА
  // ═══════════════════════════════════════════════════════════════════════

  const handleWsMessage = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case "found_opponent": {
        setMySymbol((msg as any).my_symbol ?? "X");
        setOpponent(msg.opponent);
        if (msg.map) setOnlineBoard(msg.map);
        setIsMyTurn(msg.is_your_turn);
        if (msg.board_size) { setOnlineSize(msg.board_size); onlineSizeRef.current = msg.board_size; }
        if (msg.win_length) { setOnlineWinLen(msg.win_length); onlineWinLenRef.current = msg.win_length; }
        // Запускаем таймер сразу — владелец ходит первым
        setTurnDeadline(Math.floor(Date.now() / 1000) + 120);
        setOnlinePhase("playing");
        socketRef.current?.disconnect();
        const sock = new TicTacToeSocket(lobbyIdRef.current!, "get_turn", handleWsMessage);
        sock.connect();
        socketRef.current = sock;
        break;
      }
      case "get_turn": {
        setOnlineBoard(msg.map);
        setIsMyTurn(msg.is_your_turn);
        // Обновляем таймер для следующего игрока
        if (!msg.game_over) {
          setTurnDeadline(Math.floor(Date.now() / 1000) + 120);
        } else {
          setTurnDeadline(null);
        }
        if (msg.game_over) {
          setOnlineWinnerId(msg.winner);
          if (msg.winner && msg.winner !== 0)
            setOnlineWinningLine(findWinningLineOnline(msg.map, msg.winner, onlineSizeRef.current, onlineWinLenRef.current));
          setOnlinePhase("finished");
        }
        break;
      }
      case "game_ended": {
        setOnlineBoard(msg.map);
        setOnlineWinnerId(msg.winner);
        if (msg.winner && msg.winner !== 0)
          setOnlineWinningLine(findWinningLineOnline(msg.map, msg.winner, onlineSizeRef.current, onlineWinLenRef.current));
        setOnlinePhase("finished");
        break;
      }
      case "lobby_state": {
        setOnlineBoard(msg.map);
        setIsMyTurn(msg.is_your_turn);
        break;
      }
    }
  }, []);

  const startOnlineGame = useCallback(async () => {
    setOnlineError(null);
    setOnlinePhase("searching");
    setOnlineWinningLine(null);
    setOnlineWinnerId(undefined);
    setOpponent(null);

    const bs = pendingOnlineSize;
    const wl = pendingOnlineWinLen;

    let data: GameStartResponse;
    try {
      data = await gameStart(bs, wl);
    } catch (e: any) {
      setOnlineError(e.message ?? "Ошибка подключения к серверу");
      setMode("online_settings");
      return;
    }

    const actualSize = data.board_size ?? bs;
    const actualWinLen = data.win_length ?? wl;
    setLobbyId(data.lobby_id);
    lobbyIdRef.current = data.lobby_id;
    setIsLobbyOwner(data.is_owner === true);
    setMySymbol((data as any).my_symbol ?? (data.is_owner ? "X" : "O"));
    setOnlineSize(actualSize);
    setOnlineWinLen(actualWinLen);
    onlineSizeRef.current = actualSize;
    onlineWinLenRef.current = actualWinLen;
    setOnlineBoard(data.map);
    setMode("online");

    const endpoint = data.status === "created" ? "found_opponent" : "get_turn";
    const sock = new TicTacToeSocket(data.lobby_id, endpoint, handleWsMessage);
    sock.connect();
    socketRef.current = sock;

    if (data.status === "created") {
      setOnlinePhase("waiting");
    } else if (data.status === "rejoined" && data.opponent === null) {
      // Хост перезашёл в пустое лобби — всё ещё ждём противника
      setOnlinePhase("waiting");
    } else {
      setOpponent(data.opponent);
      setIsMyTurn(data.is_your_turn ?? false);
      // Используем turn_started_at с бэка для точного дедлайна
      const startedAt = (data as any).turn_started_at;
      setTurnDeadline(startedAt ? startedAt + 120 : Math.floor(Date.now() / 1000) + 120);
      setOnlinePhase("playing");
    }
  }, [handleWsMessage, pendingOnlineSize, pendingOnlineWinLen]);

  const handleOnlineClick = useCallback(async (row: number, col: number) => {
    if (!isMyTurn || onlinePhase !== "playing" || isMakingMove) return;
    if (onlineBoard[row]?.[col] !== null) return;
    if (!lobbyId) return;
    setIsMakingMove(true);
    try {
      const res = await makeTurn(lobbyId, row, col);
      setOnlineBoard(res.map);
      setTurnDeadline(res.game_over ? null : Math.floor(Date.now() / 1000) + 120);
      if (res.game_over) {
        setOnlineWinnerId(res.winner);
        if (res.winner && res.winner !== 0)
          setOnlineWinningLine(findWinningLineOnline(res.map, res.winner, onlineSizeRef.current, onlineWinLenRef.current));
        setOnlinePhase("finished");
      } else {
        setIsMyTurn(false);
      }
    } catch (e: any) {
      setOnlineError(e.message ?? "Ошибка при ходе");
    } finally {
      setIsMakingMove(false);
    }
  }, [isMyTurn, onlinePhase, isMakingMove, onlineBoard, lobbyId]);

  const handleOnlineReset = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setLobbyId(null);
    lobbyIdRef.current = null;
    setOnlineBoard(Array.from({length:3},()=>Array(3).fill(null)));
    setIsMyTurn(false); setOpponent(null); setOnlineWinningLine(null); setIsLobbyOwner(false); setMySymbol("X");
    setOnlineWinnerId(undefined); setOnlineError(null); setTurnDeadline(null);
    setMode("menu");
  }, []);

  const getOnlineCellSymbol = (cell: number | null) => {
    if (cell === null) return "";
    return myUser && cell === myUser.id ? mySymbol : (mySymbol === "X" ? "O" : "X");
  };
  const getOnlineCellColor = (cell: number | null) => {
    if (cell === null) return "#ffffff";
    return myUser && cell === myUser.id
      ? (mySymbol === "X" ? "#dbeafe" : "#fce7f3")   // X — голубой, O — розовый
      : (mySymbol === "X" ? "#fce7f3" : "#dbeafe");  // противник — наоборот
  };
  const onlineStatusText = (): string => {
    switch (onlinePhase) {
      case "searching": return "🔍 Подключаемся...";
      case "waiting":   return `⏳ Ожидаем соперника... (${onlineSize}×${onlineSize}, ${onlineWinLen} в ряд)`;
      case "playing":   return isMyTurn ? `✅ Ваш ход${timeLeft !== null ? ` — ${timeLeft}с` : ""}` : timeLeft !== null ? `⏱ Ход соперника — ${timeLeft}с` : "⏳ Ход соперника...";
      case "finished":
        if (onlineWinnerId === 0) return "🤝 Ничья!";
        if (onlineWinnerId === undefined) return "";
        return myUser && onlineWinnerId === myUser.id ? "🎉 Вы победили!" : "😔 Вы проиграли";
    }
  };

  const onlineCellSize = Math.max(50, Math.floor(480 / onlineSize));

  const PlayerCard: React.FC<{user: CurrentUserResponse | OpponentInfo | null; label: string; symbol: "X"|"O"; active: boolean}> = ({user, label, symbol, active}) => (
    <div style={{...styles.playerCard,
      border: active
        ? `2px solid ${symbol === "X" ? "#2563eb" : "#db2777"}`
        : "2px solid #ddd",
      background: active
        ? (symbol === "X" ? "#eff6ff" : "#fdf2f8")
        : "#fafafa",
    }}>
      <div style={styles.avatar}>
        {user?.avatar
          ? <img src={user.avatar} alt="avatar" style={{width:48,height:48,borderRadius:"50%"}} />
          : <span style={{fontSize:28, color: symbol==="X" ? "#2563eb" : "#db2777"}}>{symbol==="X"?"✕":"○"}</span>}
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontWeight:600}}>{label}</div>
        <div style={{fontSize:12,color:"#888"}}>{user ? user.email : (onlinePhase==="waiting" ? "ожидание..." : "—")}</div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // РЕНДЕР
  // ═══════════════════════════════════════════════════════════════════════

  // ── Меню ────────────────────────────────────────────────────────────────
  if (mode === "menu") {
    return (
      <div style={styles.container}>
        <h2>Крестики-нолики</h2>
        <div style={{display:"flex", gap:16, marginTop:16}}>
          <Button type="primary" size="large" onClick={() => { initGame(3,3,false); setMode("local"); }}>
            🎮 Локальная игра
          </Button>
          <Button type="default" size="large" onClick={() => setMode("online_settings")}>
            🌐 Играть онлайн
          </Button>
        </div>
      </div>
    );
  }

  // ── Настройки онлайн ─────────────────────────────────────────────────
  if (mode === "online_settings") {
    return (
      <div style={styles.container}>
        <h2>Онлайн — настройки</h2>
        <p style={{color:"#888", margin:0}}>Противник должен выбрать те же параметры</p>

        {onlineError && (
          <div style={styles.errorBox}>
            ⚠️ {onlineError}
            <button onClick={() => setOnlineError(null)} style={styles.closeBtn}>×</button>
          </div>
        )}

        <div style={{display:"flex", flexDirection:"column", gap:16, marginTop:8, minWidth:280}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:16}}>
            <label>Размер поля:</label>
            <Select
              value={pendingOnlineSize}
              onChange={(v: number) => {
                setPendingOnlineSize(v);
                setPendingOnlineWinLen(prev => Math.min(prev, v));
              }}
              style={{width:100}}
            >
              {[3,4,5,6,7,8,9,10].map(n => (
                <Select.Option key={n} value={n}>{n}×{n}</Select.Option>
              ))}
            </Select>
          </div>

          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:16}}>
            <label>В ряд для победы:</label>
            <Select
              value={pendingOnlineWinLen}
              onChange={(v: number) => setPendingOnlineWinLen(v)}
              style={{width:100}}
            >
              {Array.from({length: pendingOnlineSize - 2}, (_, i) => i + 3).map(n => (
                <Select.Option key={n} value={n}>{n}</Select.Option>
              ))}
            </Select>
          </div>

          <div style={{display:"flex", gap:8, marginTop:8}}>
            <Button onClick={() => setMode("menu")} style={{flex:1}}>← Назад</Button>
            <Button type="primary" onClick={startOnlineGame} style={{flex:2}}>
              Найти игру
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Локальная игра ────────────────────────────────────────────────────
  if (mode === "local") {
    return (
      <div style={{textAlign:"center", fontFamily:"sans-serif"}}>
        <h2>Крестики-нолики</h2>
        <div style={{marginBottom:24, display:"flex", gap:24, justifyContent:"center", flexWrap:"wrap"}}>
          <div>
            <label>Размер поля: </label>
            <Select value={pendingSize} onChange={(v:number) => { setPendingSize(v); setPendingWinLength(p=>Math.min(p,v)); if(v!==3)setVsBot(false); }} style={{width:90}}>
              {[3,4,5,6,7,8,9,10].map(n=><Select.Option key={n} value={n}>{n}×{n}</Select.Option>)}
            </Select>
          </div>
          <div>
            <label>В ряд для победы: </label>
            <Select value={pendingWinLength} onChange={(v:number)=>setPendingWinLength(v)} style={{width:90}}>
              {Array.from({length:pendingSize-2},(_,i)=>i+3).map(n=><Select.Option key={n} value={n}>{n}</Select.Option>)}
            </Select>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <input type="checkbox" checked={vsBot} onChange={e=>setVsBot(e.target.checked)} disabled={pendingSize!==3} />
            <label style={{opacity:pendingSize!==3?0.6:1}}>Играть против компьютера</label>
            {pendingSize!==3 && <div style={{fontSize:12,color:"#666"}}>Бот только на 3×3</div>}
          </div>
          <Button type="primary" onClick={startNewGame}>Применить и начать заново</Button>
          <Button onClick={()=>setMode("menu")}>← В меню</Button>
        </div>

        <div style={{position:"relative", display:"inline-block", marginBottom:24}}>
          <div style={{display:"grid", gridTemplateColumns:`repeat(${size}, ${cellSize}px)`, gap:8, justifyContent:"center"}}>
            {board.map((cell, i) => (
              <div key={i} onClick={()=>handleLocalClick(i)} style={{
                width:cellSize, height:cellSize, border:"2px solid #333",
                fontSize:Math.floor(cellSize*0.7), display:"flex", alignItems:"center", justifyContent:"center",
                cursor:(vsBot&&currentPlayer===playerO)||isOver?"default":"pointer",
                background:"#fff", userSelect:"none", boxShadow:"0 3px 6px rgba(0,0,0,0.15)",
                opacity:(vsBot&&currentPlayer===playerO)?0.7:1,
              }}>
                {getSymbol(cell)}
              </div>
            ))}
          </div>
          {winningLine && <DrawWinLine winningLine={winningLine} size={size} cellSize={cellSize} gap={8} strokeWidth={4} stroke="red" strokeLinecap="round" />}
        </div>

        <h3 style={{minHeight:42}}>{localStatus}</h3>
        <Button onClick={startNewGame} size="large">Сбросить игру</Button>
      </div>
    );
  }

  // ── Онлайн-игра ───────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      <h2 style={{marginBottom:4}}>Крестики-нолики — Онлайн</h2>
      <div style={{fontSize:13, color:"#888", marginBottom:8}}>
        Поле {onlineSize}×{onlineSize} · {onlineWinLen} в ряд для победы
      </div>

      {onlineError && (
        <div style={styles.errorBox}>
          ⚠️ {onlineError}
          <button onClick={()=>setOnlineError(null)} style={styles.closeBtn}>×</button>
        </div>
      )}

      <div style={styles.players}>
        <PlayerCard user={myUser} label="Вы" symbol={mySymbol} active={isMyTurn && onlinePhase==="playing"} />
        <div style={{fontSize:24, alignSelf:"center"}}>VS</div>
        <PlayerCard user={opponent} label="Соперник" symbol={mySymbol === "X" ? "O" : "X"} active={!isMyTurn && onlinePhase==="playing"} />
      </div>

      <p style={{...styles.status, color: onlinePhase==="finished"
        ? (onlineWinnerId===0?"#888": myUser&&onlineWinnerId===myUser.id?"#22a06b":"#e34935")
        : undefined}}>
        {onlineStatusText()}
      </p>

      <div style={{position:"relative", display:"inline-block"}}>
        <div style={{display:"grid", gridTemplateColumns:`repeat(${onlineSize}, ${onlineCellSize}px)`, gap:6}}>
          {onlineBoard.flat().map((cell, i) => {
            const row = Math.floor(i / onlineSize);
            const col = i % onlineSize;
            const clickable = isMyTurn && onlinePhase==="playing" && cell===null && !isMakingMove;
            return (
              <div key={i} onClick={()=>handleOnlineClick(row, col)} style={{
                width:onlineCellSize, height:onlineCellSize,
                border: clickable ? "2px solid #94a3b8" : "2px solid #e2e8f0",
                borderRadius:6,
                fontSize:Math.floor(onlineCellSize*0.55), display:"flex", alignItems:"center", justifyContent:"center",
                cursor:clickable?"pointer":"default", background:getOnlineCellColor(cell),
                userSelect:"none", boxShadow:"0 2px 4px rgba(0,0,0,0.1)", transition:"background 0.15s",
                color: cell === null ? undefined
                  : (myUser && cell === myUser.id
                    ? (mySymbol === "X" ? "#2563eb" : "#db2777")
                    : (mySymbol === "X" ? "#db2777" : "#2563eb")),
                fontWeight: cell !== null ? 700 : undefined,
              }}>
                {getOnlineCellSymbol(cell)}
              </div>
            );
          })}
        </div>
        {onlineWinningLine && (
          <DrawWinLine winningLine={onlineWinningLine} size={onlineSize} cellSize={onlineCellSize} gap={6} strokeWidth={5}
            stroke={myUser && onlineWinnerId === myUser.id
              ? (mySymbol === "X" ? "#2563eb" : "#db2777")
              : (mySymbol === "X" ? "#db2777" : "#2563eb")}
            strokeLinecap="round" />
        )}
      </div>

      <div style={{marginTop:24, display:"flex", gap:12}}>
        <Button onClick={handleOnlineReset} danger={onlinePhase==="playing"}>
          {onlinePhase==="finished" ? "Играть снова" : "Выйти из игры"}
        </Button>
        {isLobbyOwner && onlinePhase === "waiting" && (
          <Button danger onClick={async () => {
            if (!lobbyId) return;
            try { await deleteLobby(lobbyId); } catch {}
            handleOnlineReset();
          }}>
            🗑 Удалить лобби
          </Button>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { textAlign:"center", fontFamily:"sans-serif", padding:24, display:"flex", flexDirection:"column", alignItems:"center", gap:16 },
  players: { display:"flex", gap:32, justifyContent:"center", alignItems:"stretch", marginBottom:8 },
  playerCard: { borderRadius:12, padding:"12px 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:8, minWidth:140, background:"#fafafa", transition:"border 0.2s" },
  avatar: { width:52, height:52, borderRadius:"50%", background:"#f0f0f0", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" },
  status: { fontSize:18, fontWeight:600, margin:0, minHeight:28 },
  errorBox: { background:"#fff2f0", border:"1px solid #ffccc7", borderRadius:8, padding:"8px 16px", color:"#cf1322", display:"flex", alignItems:"center", gap:12 },
  closeBtn: { background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#cf1322", padding:0 },
};

export default TicTacToe;