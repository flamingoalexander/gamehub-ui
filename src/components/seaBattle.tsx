import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "antd";
import SeaBattle from "./scripts/SeaBattle/SeaBattle";
import Ship from "./scripts/SeaBattle/Ship";
import SeaBattlePlayer from "./scripts/SeaBattle/SeaBattlePlayer";

import {
  SEA_SIZE, SHIP_LENGTHS,
  sbGameStart, sbPlaceShips, sbShoot, sbDeleteLobby, sbLeaveLobby, sbGetMe,
  SeaBattleSocket,
  type Field, type UserInfo, type WsMessage, type GameStartResponse,
} from "../seaBattleApi";

// ─── Типы ─────────────────────────────────────────────────────────────────────

type Mode = "menu" | "local" | "online_waiting" | "online_placing" | "online_playing" | "online_finished";

const TOTAL_CELLS = SHIP_LENGTHS.reduce((a, b) => a + b, 0);

// ─── Хелперы ─────────────────────────────────────────────────────────────────

function emptyField(): Field {
  return Array.from({ length: SEA_SIZE }, () => Array(SEA_SIZE).fill(null));
}

function canPlace(field: Field, r: number, c: number, len: number, horiz: boolean): boolean {
  for (let i = 0; i < len; i++) {
    const pr = r + (horiz ? 0 : i);
    const pc = c + (horiz ? i : 0);
    if (pr >= SEA_SIZE || pc >= SEA_SIZE) return false;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = pr + dr, nc = pc + dc;
        if (nr >= 0 && nr < SEA_SIZE && nc >= 0 && nc < SEA_SIZE && field[nr][nc] === 1)
          return false;
      }
    }
  }
  return true;
}

function placeShip(field: Field, r: number, c: number, len: number, horiz: boolean): Field {
  const f = field.map(row => [...row]) as Field;
  for (let i = 0; i < len; i++) {
    const pr = r + (horiz ? 0 : i);
    const pc = c + (horiz ? i : 0);
    f[pr][pc] = 1;
  }
  return f;
}

function autoPlace(): Field {
  let field = emptyField();
  for (const len of SHIP_LENGTHS) {
    let placed = false;
    while (!placed) {
      const horiz = Math.random() < 0.5;
      const r = Math.floor(Math.random() * SEA_SIZE);
      const c = Math.floor(Math.random() * SEA_SIZE);
      if (canPlace(field, r, c, len, horiz)) {
        field = placeShip(field, r, c, len, horiz);
        placed = true;
      }
    }
  }
  return field;
}

// ─── Компонент ───────────────────────────────────────────────────────────────

const Battleship: React.FC = () => {
  const [mode, setMode] = useState<Mode>("menu");

  // ── Локальная игра ────────────────────────────────────────────────────────
  const playerGameRef       = useRef<SeaBattle | null>(null);
  const computerGameRef     = useRef<SeaBattle | null>(null);
  const [playerHits,        setPlayerHits]        = useState<boolean[][]>([]);
  const [computerHits,      setComputerHits]      = useState<boolean[][]>([]);
  const [playerHitsCount,   setPlayerHitsCount]   = useState(0);
  const [computerHitsCount, setComputerHitsCount] = useState(0);
  const [playerShots,       setPlayerShots]       = useState(0);
  const [computerShots,     setComputerShots]     = useState(0);
  const [placingShips,      setPlacingShips]      = useState<number[]>([]);
  const [isHorizontal,      setIsHorizontal]      = useState(true);
  const [turn,              setTurn]              = useState<"player" | "computer">("player");
  const [gameStarted,       setGameStarted]       = useState(false);

  // ── Онлайн ───────────────────────────────────────────────────────────────
  const [onlineError,  setOnlineError]  = useState<string | null>(null);
  const [lobbyId,      setLobbyId]      = useState<number | null>(null);
  const [isOwner,      setIsOwner]      = useState(false);
  const [myUser,       setMyUser]       = useState<UserInfo | null>(null);
  const [opponent,     setOpponent]     = useState<UserInfo | null>(null);
  const [myReady,      setMyReady]      = useState(false);
  const [enemyReady,   setEnemyReady]   = useState(false);
  const [isMyTurn,     setIsMyTurn]     = useState(false);
  const [winner,       setWinner]       = useState<number | null | undefined>(undefined);
  const [isShooting,   setIsShooting]   = useState(false);

  // ── Таймер хода ───────────────────────────────────────────────────────────
  const [turnDeadline, setTurnDeadline] = useState<number | null>(null);
  // timeLeft вычисляется синхронно при каждом рендере — нет задержки на первый тик
  const [, forceUpdate] = useState(0);

  const timeLeft = turnDeadline !== null
    ? Math.max(0, turnDeadline - Math.floor(Date.now() / 1000))
    : null;

  // Поля расстановки
  const [placingField, setPlacingField] = useState<Field>(emptyField());
  const [placingIdx,   setPlacingIdx]   = useState(0);
  const [placingHoriz, setPlacingHoriz] = useState(true);

  // Поля игры
  const [myShips,   setMyShips]   = useState<Field>(emptyField());
  const [myShots,   setMyShots]   = useState<Field>(emptyField());
  const [enemyView, setEnemyView] = useState<Field>(emptyField());

  const socketRef  = useRef<SeaBattleSocket | null>(null);
  const lobbyIdRef = useRef<number | null>(null);

  // ── Инициализация ────────────────────────────────────────────────────────
  useEffect(() => {
    sbGetMe().then(setMyUser).catch(() => {});
    resetLocal();
  }, []);

  useEffect(() => {
    if (mode !== "local") return;
    if (turn === "computer" && gameStarted) computerShoot();
  }, [turn, mode]);

  useEffect(() => {
    return () => { socketRef.current?.disconnect(); };
  }, []);

  // ── Таймер: перерисовываем компонент каждую секунду ─────────────────────
  useEffect(() => {
    if (turnDeadline === null) return;
    const id = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [turnDeadline]);

  // ── Завершение игры по таймеру (клиентская сторона) ─────────────────────
  // Проигрывает тот, чей был ход. Удаляем лобби сразу.
  useEffect(() => {
    if (timeLeft !== 0) return;
    if (mode !== "online_playing") return;
    const w = isMyTurn ? (opponent?.id ?? null) : (myUser?.id ?? null);
    setWinner(w);
    setTurnDeadline(null);
    // НЕ обнуляем lobbyIdRef — handleOnlineReset вызовет sbLeaveLobby
    setMode("online_finished");
  }, [timeLeft, mode]);

  // ═══════════════════════════════════════════════════════════════════════
  // ЛОКАЛЬНАЯ ИГРА
  // ═══════════════════════════════════════════════════════════════════════

  const resetLocal = () => {
    const playerField: (Ship | undefined)[][] = Array.from({ length: SEA_SIZE }, () => Array(SEA_SIZE).fill(undefined));
    const playerGame = new SeaBattle(playerField);
    const computerAttacker = new SeaBattlePlayer(new Set<Ship>(), playerGame);
    const humanDefender    = new SeaBattlePlayer(new Set<Ship>(), playerGame);
    playerGame.players = [computerAttacker, humanDefender];
    humanDefender.hasAnyShip = function() { return [...this.ships].some(s => !s.isDestroyed); };
    playerGame.destroyShip = function(row, column) {
      const s = this.field[row][column];
      if (!s) throw "Empty"; if (s.isDestroyed) throw "Already";
      (s as any).hitCount = ((s as any).hitCount || 0) + 1;
      if ((s as any).hitCount >= s.size) s.isDestroyed = true;
      if (!s.placedBy.hasAnyShip()) this.gameState = 2;
    };
    playerGameRef.current = playerGame;

    const computerField: (Ship | undefined)[][] = Array.from({ length: SEA_SIZE }, () => Array(SEA_SIZE).fill(undefined));
    const computerGame = new SeaBattle(computerField);
    const humanAttacker    = new SeaBattlePlayer(new Set<Ship>(), computerGame);
    const computerDefender = new SeaBattlePlayer(new Set<Ship>(), computerGame);
    computerGame.players = [humanAttacker, computerDefender];
    computerDefender.hasAnyShip = function() { return [...this.ships].some(s => !s.isDestroyed); };
    computerGame.destroyShip = function(row, column) {
      const s = this.field[row][column];
      if (!s) throw "Empty"; if (s.isDestroyed) throw "Already";
      (s as any).hitCount = ((s as any).hitCount || 0) + 1;
      if ((s as any).hitCount >= s.size) s.isDestroyed = true;
      if (!s.placedBy.hasAnyShip()) this.gameState = 2;
    };
    placeRandomShipsLocal(computerGame, computerDefender, SHIP_LENGTHS);
    computerGameRef.current = computerGame;

    setPlayerHits(Array.from({ length: SEA_SIZE }, () => Array(SEA_SIZE).fill(false)));
    setComputerHits(Array.from({ length: SEA_SIZE }, () => Array(SEA_SIZE).fill(false)));
    setPlayerHitsCount(0); setComputerHitsCount(0);
    setPlayerShots(0); setComputerShots(0);
    setPlacingShips(SHIP_LENGTHS.slice());
    setIsHorizontal(true); setTurn("player"); setGameStarted(false);
  };

  const placeRandomShipsLocal = (game: SeaBattle, player: SeaBattlePlayer, lengths: number[]) => {
    for (const length of lengths) {
      let placed = false;
      while (!placed) {
        const horiz = Math.random() < 0.5;
        const r = Math.floor(Math.random() * SEA_SIZE);
        const c = Math.floor(Math.random() * SEA_SIZE);
        let ok = true;
        for (let i = 0; i < length; i++) {
          const pr = r + (horiz ? 0 : i), pc = c + (horiz ? i : 0);
          if (pr >= SEA_SIZE || pc >= SEA_SIZE || game.field[pr][pc]) { ok = false; break; }
        }
        if (ok) {
          const ship = new Ship(length, player);
          (ship as any).hitCount = 0;
          player.ships.add(ship);
          for (let i = 0; i < length; i++) game.placeShip(ship, r + (horiz ? 0 : i), c + (horiz ? i : 0));
          placed = true;
        }
      }
    }
  };

  const localPlayerBoardClick = (r: number, c: number) => {
    if (placingShips.length === 0) return;
    const len = placingShips[0];
    let ok = true;
    for (let i = 0; i < len; i++) {
      const pr = r + (isHorizontal ? 0 : i), pc = c + (isHorizontal ? i : 0);
      if (pr >= SEA_SIZE || pc >= SEA_SIZE || playerGameRef.current?.field[pr]?.[pc]) { ok = false; break; }
    }
    if (!ok) return;
    const ship = new Ship(len, playerGameRef.current?.players[1]!);
    (ship as any).hitCount = 0;
    playerGameRef.current?.players[1].ships.add(ship);
    for (let i = 0; i < len; i++)
      playerGameRef.current?.placeShip(ship, r + (isHorizontal ? 0 : i), c + (isHorizontal ? i : 0));
    setPlacingShips(prev => prev.slice(1));
    if (placingShips.length === 1) {
      playerGameRef.current?.startGame();
      computerGameRef.current?.startGame();
      setGameStarted(true);
    }
  };

  const localOpponentBoardClick = (r: number, c: number) => {
    if (placingShips.length > 0 || !gameStarted || turn !== "player") return;
    if (playerHits[r][c]) return;
    const newHits = playerHits.map(row => row.slice());
    newHits[r][c] = true; setPlayerHits(newHits);
    const ship = computerGameRef.current?.field[r][c];
    if (ship) { try { computerGameRef.current?.destroyShip(r, c); setPlayerHitsCount(h => h + 1); } catch {} }
    setPlayerShots(s => s + 1);
    if (computerGameRef.current?.gameState !== 2) setTurn("computer");
  };

  const computerShoot = () => {
    let shot = false;
    while (!shot) {
      const r = Math.floor(Math.random() * SEA_SIZE), c = Math.floor(Math.random() * SEA_SIZE);
      if (!computerHits[r][c]) {
        const newHits = computerHits.map(row => row.slice());
        newHits[r][c] = true; setComputerHits(newHits);
        const ship = playerGameRef.current?.field[r][c];
        if (ship) { try { playerGameRef.current?.destroyShip(r, c); setComputerHitsCount(h => h + 1); } catch {} }
        setComputerShots(s => s + 1); shot = true;
      }
    }
    if (playerGameRef.current?.gameState !== 2) setTurn("player");
  };

  const localPlacing = placingShips.length > 0;
  const playerWin    = computerGameRef.current?.gameState === 2;
  const computerWin  = playerGameRef.current?.gameState  === 2;

  // ═══════════════════════════════════════════════════════════════════════
  // ОНЛАЙН-ИГРА
  // ═══════════════════════════════════════════════════════════════════════

  const handleWsMessage = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case "opponent_joined":
        setOpponent(msg.opponent);
        setMode("online_placing");
        break;

      case "player_ready":
        if (msg.user_id !== myUser?.id) setEnemyReady(true);
        if (msg.both_ready) {
          const iMyTurn = msg.first_turn === myUser?.id;
          setIsMyTurn(iMyTurn);
          // Бэк не даёт timestamp при старте — берём текущее время
          setTurnDeadline(Math.floor(Date.now() / 1000) + 120);
          setMode("online_playing");
        }
        break;

      case "shot": {
        const isShooterMe = msg.shooter_id === myUser?.id;
        if (isShooterMe) {
          setEnemyView(prev => {
            const f = prev.map(r => [...r]) as Field;
            f[msg.row][msg.col] = msg.hit ? 2 : 0;
            return f;
          });
        } else {
          setMyShots(prev => {
            const f = prev.map(r => [...r]) as Field;
            f[msg.row][msg.col] = msg.hit ? 2 : 0;
            return f;
          });
        }
        setIsMyTurn(msg.is_your_turn);
        // Запускаем таймер для того, чей наступил ход
        setTurnDeadline(msg.timestamp + 120);
        if (msg.game_over) {
          setWinner(msg.winner);
          setTurnDeadline(null);
          setMode("online_finished");
        }
        break;
      }

      case "lobby_deleted":
        setOnlineError("Владелец удалил лобби");
        handleOnlineReset();
        break;

      case "game_ended": {
        // Бек завершил игру по таймауту
        setWinner((msg as any).winner ?? null);
        setTurnDeadline(null);
        // НЕ обнуляем lobbyIdRef — handleOnlineReset вызовет sbLeaveLobby
        setMode("online_finished");
        break;
      }
    }
  }, [myUser?.id]);

  const startOnlineGame = useCallback(async () => {
    setOnlineError(null);
    let data: GameStartResponse;
    try {
      data = await sbGameStart();
    } catch (e: any) {
      setOnlineError(e.message ?? "Ошибка подключения");
      return;
    }

    setLobbyId(data.lobby_id);
    lobbyIdRef.current = data.lobby_id;
    setIsOwner(data.is_owner);
    setOpponent(data.opponent);
    setMyReady(data.my_ready);
    setEnemyReady(data.enemy_ready);
    setMyShips(data.my_ships);
    setMyShots(data.my_shots);
    setEnemyView(data.enemy_view);
    setWinner(undefined);
    setPlacingField(data.my_ready ? data.my_ships : emptyField());
    setPlacingIdx(0);
    setPlacingHoriz(true);

    const sock = new SeaBattleSocket(data.lobby_id, handleWsMessage);
    sock.connect();
    socketRef.current = sock;

    if (data.status === "rejoined" && data.my_ready && data.enemy_ready) {
      setIsMyTurn(data.is_your_turn);
      // Берём дедлайн с сервера — иначе сбрасываем в null (игра ещё не шла)
      const deadline = (data as any).turn_deadline as number | null | undefined;
      setTurnDeadline(deadline ?? null);
      setMode("online_playing");
    } else if (data.status === "rejoined" && data.my_ready) {
      setTurnDeadline(null);
      setMode(data.opponent ? "online_placing" : "online_waiting");
    } else if (data.status === "joined") {
      setTurnDeadline(null);
      setMode("online_placing");
    } else {
      setTurnDeadline(null);
      setMode("online_waiting");
    }
  }, [handleWsMessage]);

  const handleOnlineReset = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    // Покидаем лобби — бэк удалит его когда оба игрока уйдут
    if (lobbyIdRef.current) {
      sbLeaveLobby(lobbyIdRef.current).catch(() => {});
    }
    setLobbyId(null); lobbyIdRef.current = null;
    setOpponent(null); setMyReady(false); setEnemyReady(false);
    setIsMyTurn(false); setWinner(undefined); setOnlineError(null);
    setTurnDeadline(null);
    setMyShips(emptyField()); setMyShots(emptyField()); setEnemyView(emptyField());
    setPlacingField(emptyField()); setPlacingIdx(0);
    setMode("menu");
  }, []);

  const handlePlacingClick = (r: number, c: number) => {
    if (placingIdx >= SHIP_LENGTHS.length) return;
    const len = SHIP_LENGTHS[placingIdx];
    if (!canPlace(placingField, r, c, len, placingHoriz)) return;
    const newField = placeShip(placingField, r, c, len, placingHoriz);
    setPlacingField(newField);
    setPlacingIdx(prev => prev + 1);
  };

  const handleConfirmPlacement = async () => {
    if (placingIdx < SHIP_LENGTHS.length || !lobbyId) return;
    try {
      const res = await sbPlaceShips(lobbyId, placingField);
      setMyShips(placingField);
      setMyReady(true);
      if (res.both_ready) {
        setIsMyTurn(res.is_your_turn);
        // Стартуем таймер от текущего момента — бэк не возвращает deadline здесь
        setTurnDeadline(Math.floor(Date.now() / 1000) + 120);
        setMode("online_playing");
      }
    } catch (e: any) {
      setOnlineError(e.message);
    }
  };

  const handleAutoPlace = () => {
    setPlacingField(autoPlace());
    setPlacingIdx(SHIP_LENGTHS.length);
  };

  const handleOnlineShoot = async (r: number, c: number) => {
    if (!isMyTurn || isShooting || !lobbyId) return;
    if (enemyView[r][c] !== null) return;
    setIsShooting(true);
    try {
      const res = await sbShoot(lobbyId, r, c);
      setEnemyView(prev => {
        const f = prev.map(row => [...row]) as Field;
        f[r][c] = res.hit ? 2 : 0;
        return f;
      });
      setIsMyTurn(res.is_your_turn);
      // Не сбрасываем таймер — WS shot обновит его когда придёт ответ
      if (res.game_over) {
        setWinner(res.winner);
        setMode("online_finished");
      }
    } catch (e: any) {
      setOnlineError(e.message);
    } finally {
      setIsShooting(false);
    }
  };

  // ── Текст статуса с таймером ──────────────────────────────────────────────
  const onlineStatusText = (): string => {
    if (isMyTurn) {
      return timeLeft !== null
        ? `✅ Ваш ход — осталось ${timeLeft}с`
        : "✅ Ваш ход — стреляйте по полю противника";
    }
    return timeLeft !== null
      ? `⏱ Ход соперника — осталось ${timeLeft}с`
      : "⏳ Ход соперника...";
  };

  // ═══════════════════════════════════════════════════════════════════════
  // РЕНДЕР ПОЛЕЙ
  // ═══════════════════════════════════════════════════════════════════════

  const renderOnlineField = (
    field: Field,
    shots: Field,
    clickable: boolean,
    onClick?: (r: number, c: number) => void,
    showShips = true,
  ) => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${SEA_SIZE}, 40px)`, gap: 4 }}>
      {Array.from({ length: SEA_SIZE }).map((_, r) =>
        Array.from({ length: SEA_SIZE }).map((_, c) => {
          const shotVal = shots[r]?.[c];
          const shipVal = field[r]?.[c];
          const hasShot = shotVal !== null && shotVal !== undefined;
          const bg = hasShot
            ? (shotVal === 2 ? "#52c41a" : "#ff4d4f")
            : (showShips && shipVal === 1 ? "#a0d911" : "#1890ff");
          const emoji = hasShot
            ? (shotVal === 2 ? "💥" : "•")
            : (showShips && shipVal === 1 ? "🚢" : "");
          return (
            <div key={`${r}-${c}`}
              onClick={() => clickable && onClick?.(r, c)}
              style={{
                width: 40, height: 40, border: "1px solid #333",
                cursor: clickable && shots[r]?.[c] === null ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: bg, color: "#fff", fontWeight: "bold",
              }}
            >{emoji}</div>
          );
        })
      )}
    </div>
  );

  const renderPlacingField = () => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${SEA_SIZE}, 40px)`, gap: 4 }}>
      {Array.from({ length: SEA_SIZE }).map((_, r) =>
        Array.from({ length: SEA_SIZE }).map((_, c) => {
          const val = placingField[r]?.[c];
          return (
            <div key={`${r}-${c}`}
              onClick={() => handlePlacingClick(r, c)}
              style={{
                width: 40, height: 40, border: "1px solid #333",
                cursor: placingIdx < SHIP_LENGTHS.length ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: val === 1 ? "#a0d911" : "#1890ff",
                color: "#fff", fontWeight: "bold",
              }}
            >{val === 1 ? "🚢" : ""}</div>
          );
        })
      )}
    </div>
  );

  // ── Карточка игрока ───────────────────────────────────────────────────────
  const PlayerCard: React.FC<{ user: UserInfo | null; label: string; active: boolean; ready?: boolean }> = ({ user, label, active, ready }) => (
    <div style={{ ...styles.playerCard, border: active ? "2px solid #1677ff" : "2px solid #ddd" }}>
      <div style={styles.avatar}>
        {user?.avatar
          ? <img src={user.avatar} alt="" style={{ width: 48, height: 48, borderRadius: "50%" }} />
          : <span style={{ fontSize: 28 }}>👤</span>}
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 600, color: "black"}}>{label}</div>
        <div style={{ fontSize: 12, color: "#888" }}>{user?.email ?? "ожидание..."}</div>
        {ready !== undefined && (
          <div style={{ fontSize: 12, color: ready ? "#22a06b" : "#888", marginTop: 4 }}>
            {ready ? "✅ Готов" : "⏳ Расставляет..."}
          </div>
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // РЕНДЕР
  // ═══════════════════════════════════════════════════════════════════════

  // ── Меню ─────────────────────────────────────────────────────────────────
  if (mode === "menu") {
    return (
      <div style={styles.container}>
        <h2>🚢 Морской бой</h2>
        {onlineError && (
          <div style={styles.errorBox}>
            ⚠️ {onlineError}
            <button onClick={() => setOnlineError(null)} style={styles.closeBtn}>×</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          <Button type="primary" size="large" onClick={() => { resetLocal(); setMode("local"); }}>
            🎮 Локальная игра
          </Button>
          <Button type="default" size="large" onClick={startOnlineGame}>
            🌐 Играть онлайн
          </Button>
        </div>
      </div>
    );
  }

  // ── Ожидание противника ───────────────────────────────────────────────────
  if (mode === "online_waiting") {
    return (
      <div style={styles.container}>
        <h2>🚢 Морской бой — Онлайн</h2>
        <p style={{ color: "#888" }}>⏳ Ожидаем соперника...</p>
        <div style={styles.players}>
          <PlayerCard user={myUser} label="Вы" active={false} />
          <div style={{ fontSize: 24, alignSelf: "center" }}>VS</div>
          <PlayerCard user={null} label="Соперник" active={false} />
        </div>
        {isOwner && (
          <Button danger onClick={async () => {
            if (lobbyId) { try { await sbDeleteLobby(lobbyId); } catch {} }
            handleOnlineReset();
          }}>
            🗑 Удалить лобби
          </Button>
        )}
        <Button onClick={handleOnlineReset} style={{ marginTop: 8 }}>← В меню</Button>
      </div>
    );
  }

  // ── Расстановка кораблей ──────────────────────────────────────────────────
  if (mode === "online_placing") {
    return (
      <div style={styles.container}>
        <h2>🚢 Морской бой — Расстановка</h2>
        <div style={styles.players}>
          <PlayerCard user={myUser} label="Вы" active={false} ready={myReady} />
          <div style={{ fontSize: 24, alignSelf: "center" }}>VS</div>
          <PlayerCard user={opponent} label="Соперник" active={false} ready={enemyReady} />
        </div>

        {!myReady ? (
          <>
            <p style={{ margin: 0 }}>
              {placingIdx < SHIP_LENGTHS.length
                ? `Разместите корабль длины ${SHIP_LENGTHS[placingIdx]} (осталось: ${SHIP_LENGTHS.slice(placingIdx).join(", ")})`
                : "Все корабли расставлены! Нажмите «Готов»"}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {placingIdx < SHIP_LENGTHS.length && (
                <Button onClick={() => setPlacingHoriz(h => !h)}>
                  {placingHoriz ? "↕ Вертикально" : "↔ Горизонтально"}
                </Button>
              )}
              <Button onClick={handleAutoPlace}>🎲 Авто</Button>
              {placingIdx > 0 && (
                <Button onClick={() => { setPlacingField(emptyField()); setPlacingIdx(0); }}>
                  🔄 Сбросить
                </Button>
              )}
            </div>
            {renderPlacingField()}
            {placingIdx >= SHIP_LENGTHS.length && (
              <Button type="primary" size="large" onClick={handleConfirmPlacement}>
                ✅ Готов!
              </Button>
            )}
          </>
        ) : (
          <p style={{ color: "#22a06b", fontWeight: 600 }}>
            ✅ Вы готовы! Ждём соперника...
          </p>
        )}

        <Button onClick={handleOnlineReset} danger>Выйти</Button>
      </div>
    );
  }

  // ── Игра / финиш ─────────────────────────────────────────────────────────
  if (mode === "online_playing" || mode === "online_finished") {
    const finished = mode === "online_finished";
    const iWon = winner === myUser?.id;

    return (
      <div style={styles.container}>
        <h2>🚢 Морской бой — Онлайн</h2>

        {onlineError && (
          <div style={styles.errorBox}>
            ⚠️ {onlineError}
            <button onClick={() => setOnlineError(null)} style={styles.closeBtn}>×</button>
          </div>
        )}

        <div style={styles.players}>
          <PlayerCard user={myUser}    label="Вы"       active={isMyTurn  && !finished} />
          <div style={{ fontSize: 24, alignSelf: "center" }}>VS</div>
          <PlayerCard user={opponent}  label="Соперник" active={!isMyTurn && !finished} />
        </div>

        {/* Статус с таймером */}
        {finished ? (
          <p style={{ ...styles.status, color: winner === 0 ? "#888" : iWon ? "#22a06b" : "#e34935" }}>
            {winner === 0 ? "🤝 Ничья!" : iWon ? "🎉 Вы победили!" : "😔 Вы проиграли"}
          </p>
        ) : (
          <p style={{
            ...styles.status,
            color: isMyTurn
              ? (timeLeft !== null && timeLeft <= 10 ? "#e34935" : "#22a06b")
              : "#888",
          }}>
            {onlineStatusText()}
          </p>
        )}

        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center" }}>
          <div>
            <h3 style={{ textAlign: "center" }}>Ваше поле</h3>
            {renderOnlineField(myShips, myShots, false, undefined, true)}
          </div>
          <div>
            <h3 style={{ textAlign: "center" }}>Поле противника</h3>
            {renderOnlineField(emptyField(), enemyView, isMyTurn && !finished, handleOnlineShoot, false)}
          </div>
        </div>

        <Button onClick={handleOnlineReset} danger={!finished} style={{ marginTop: 16 }}>
          {finished ? "Играть снова" : "Выйти из игры"}
        </Button>
      </div>
    );
  }

  // ── Локальная игра ────────────────────────────────────────────────────────
  return (
    <div style={{ textAlign: "center" }}>
      <h2>🚢 Морской бой</h2>
      {localPlacing && placingShips[0] && <h3>Разместите корабль длины {placingShips[0]}</h3>}
      {localPlacing && (
        <Button onClick={() => setIsHorizontal(!isHorizontal)}>
          Переключить на {isHorizontal ? "Вертикально" : "Горизонтально"}
        </Button>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
        <div>
          <h3>Ваше поле</h3>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${SEA_SIZE}, 40px)`, gap: 4, marginBottom: 16 }}>
            {Array.from({ length: SEA_SIZE }).map((_, r) =>
              Array.from({ length: SEA_SIZE }).map((_, c) => (
                <div key={`${r}-${c}-p`} onClick={() => localPlayerBoardClick(r, c)}
                  style={{
                    width: 40, height: 40, border: "1px solid #333",
                    cursor: localPlacing ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: computerHits[r]?.[c]
                      ? (playerGameRef.current?.field[r]?.[c] ? "#52c41a" : "#ff4d4f")
                      : (playerGameRef.current?.field[r]?.[c] ? "#a0d911" : "#1890ff"),
                    color: "#fff", fontWeight: "bold",
                  }}>
                  {computerHits[r]?.[c] ? (playerGameRef.current?.field[r]?.[c] ? "💥" : "•") : (playerGameRef.current?.field[r]?.[c] ? "🚢" : "")}
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <h3>Поле противника</h3>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${SEA_SIZE}, 40px)`, gap: 4, marginBottom: 16 }}>
            {Array.from({ length: SEA_SIZE }).map((_, r) =>
              Array.from({ length: SEA_SIZE }).map((_, c) => (
                <div key={`${r}-${c}-o`} onClick={() => localOpponentBoardClick(r, c)}
                  style={{
                    width: 40, height: 40, border: "1px solid #333",
                    cursor: !localPlacing && gameStarted && turn === "player" ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: playerHits[r]?.[c]
                      ? (computerGameRef.current?.field[r]?.[c] ? "#52c41a" : "#ff4d4f")
                      : "#1890ff",
                    color: "#fff", fontWeight: "bold",
                  }}>
                  {playerHits[r]?.[c] ? (computerGameRef.current?.field[r]?.[c] ? "💥" : "•") : ""}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {!localPlacing && (
        <>
          <h3>Ваши попадания: {playerHitsCount} / {TOTAL_CELLS}</h3>
          <h3>Ваши выстрелы: {playerShots}</h3>
          <h3>Попадания противника: {computerHitsCount} / {TOTAL_CELLS}</h3>
          <h3>Выстрелы противника: {computerShots}</h3>
        </>
      )}
      {playerWin   && <h2 style={{ color: "green" }}>Победа! 🎉</h2>}
      {computerWin && <h2 style={{ color: "red" }}>Поражение! 😞</h2>}

      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <Button onClick={resetLocal}>Новая игра</Button>
        <Button onClick={() => setMode("menu")}>← В меню</Button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container:  { textAlign: "center", fontFamily: "sans-serif", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 },
  players:    { display: "flex", gap: 32, justifyContent: "center", alignItems: "stretch", marginBottom: 8 },
  playerCard: { borderRadius: 12, padding: "12px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 140, background: "#fafafa", transition: "border 0.2s" },
  avatar:     { width: 52, height: 52, borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  status:     { fontSize: 18, fontWeight: 600, margin: 0, minHeight: 28, transition: "color 0.3s" },
  errorBox:   { background: "#fff2f0", border: "1px solid #ffccc7", borderRadius: 8, padding: "8px 16px", color: "#cf1322", display: "flex", alignItems: "center", gap: 12 },
  closeBtn:   { background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#cf1322", padding: 0 },
};

export default Battleship;
