import React, { useState, useEffect } from "react";
import { Button, Select } from "antd";

import TicTacToeChars from "../scripts/TicTacToe/TicTacToeCharsEnum";
import DrawWinLine from "../winLine";

import { useLocalGame } from "./localGameUtils";
import styles from "./styles";
import type { Mode } from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface LocalGameProps {
  mode: "local-pvp" | "local-bot";
  onExit: () => void;
}

// ─── Компонент ───────────────────────────────────────────────────────────────

const LocalGame: React.FC<LocalGameProps> = ({ mode, onExit }) => {
  const isPvp = mode === "local-pvp";
  const isBot = mode === "local-bot";

  // ── Имена игроков ─────────────────────────────────────────────────────────
  const [p1Name, setP1Name] = useState("Игрок 1");
  const [p2Name, setP2Name] = useState(isBot ? "Компьютер" : "Игрок 2");

  // ── Настройки поля ────────────────────────────────────────────────────────
  // Для бота поле всегда 3×3; для PvP — выбирается
  const [pendingSize, setPendingSize]         = useState(3);
  const [pendingWinLength, setPendingWinLength] = useState(3);

  // ── Игровая логика (хук) ──────────────────────────────────────────────────
  const {
    playerX, playerO, currentPlayer,
    board, winningLine, size, winLength,
    isOver, winner,
    initGame, handleClick, getSymbol,
  } = useLocalGame({ vsBot: isBot, mode });

  const cellSize = Math.max(50, Math.floor(480 / size));
  const gameStarted = board.length > 0;
  const isBotTurn = isBot && gameStarted && currentPlayer === playerO && !isOver;

  // ── Автостарт при открытии экрана ────────────────────────────────────────
  useEffect(() => {
    initGame(pendingSize, pendingWinLength, p1Name, isBot ? "Компьютер" : p2Name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Запуск / рестарт ──────────────────────────────────────────────────────
  const startGame = (newSize = pendingSize, newWl = pendingWinLength) => {
    const clampedWl = Math.min(newWl, newSize);
    initGame(newSize, clampedWl, p1Name || "Игрок 1", isBot ? "Компьютер" : (p2Name || "Игрок 2"));
    setPendingWinLength(clampedWl);
  };

  // ── Статус ────────────────────────────────────────────────────────────────
  const getPlayerName = (p: typeof playerX) => p?.name ?? "?";

  const statusText = isOver
    ? (winner ? `🏆 Победил ${getPlayerName(winner)}!` : "🤝 Ничья!")
    : isBotTurn
      ? "🤖 Компьютер думает..."
      : `Ход: ${getPlayerName(currentPlayer)}`;

  const statusColor = isOver ? (winner ? "#1677ff" : "#888") : undefined;

  const p1Active = !isOver && currentPlayer === playerX;
  const p2Active = !isOver && currentPlayer === playerO;

  // ── Рендер ────────────────────────────────────────────────────────────────
  return (
    <div style={{ textAlign: "center", fontFamily: "sans-serif", padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>
        {isPvp ? "👥 Два игрока" : "🤖 Против компьютера"}
      </h2>

      {/* ── Карточки игроков ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
        {/* Игрок 1 (X) */}
        <div style={{ ...styles.localPlayerCard, border: p1Active ? "2px solid #1677ff" : "2px solid #e0e0e0" }}>
          <div style={{ fontSize: 32 }}>❌</div>
          <input
            value={p1Name}
            onChange={e => setP1Name(e.target.value)}
            style={styles.nameInput}
            maxLength={16}
            placeholder="Игрок 1"
            disabled={!isOver && board.some(c => c !== TicTacToeChars.empty)}
          />
          {p1Active && <div style={styles.turnDot} />}
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, color: "#aaa" }}>VS</div>

        {/* Игрок 2 (O) */}
        <div style={{ ...styles.localPlayerCard, border: p2Active ? "2px solid #ff4d4f" : "2px solid #e0e0e0" }}>
          <div style={{ fontSize: 32 }}>⭕</div>
          {isPvp ? (
            <input
              value={p2Name}
              onChange={e => setP2Name(e.target.value)}
              style={styles.nameInput}
              maxLength={16}
              placeholder="Игрок 2"
              disabled={!isOver && board.some(c => c !== TicTacToeChars.empty)}
            />
          ) : (
            <div style={{ fontWeight: 700, fontSize: 15 }}>Компьютер</div>
          )}
          {p2Active && <div style={{ ...styles.turnDot, background: "#ff4d4f" }} />}
        </div>
      </div>

      {/* ── Настройки поля ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <label style={{ fontSize: 13, color: "#555" }}>Поле: </label>
          <Select
            value={pendingSize}
            size="small"
            style={{ width: 80 }}
            disabled={isBot}
            onChange={(v: number) => {
              setPendingSize(v);
              setPendingWinLength(prev => Math.min(prev, v));
            }}
          >
            {(isBot ? [3] : [3, 4, 5, 6, 7, 8, 9, 10]).map(n => (
              <Select.Option key={n} value={n}>{n}×{n}</Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <label style={{ fontSize: 13, color: "#555" }}>В ряд: </label>
          <Select
            value={pendingWinLength}
            size="small"
            style={{ width: 70 }}
            onChange={(v: number) => setPendingWinLength(v)}
          >
            {Array.from({ length: pendingSize - 2 }, (_, i) => i + 3).map(n => (
              <Select.Option key={n} value={n}>{n}</Select.Option>
            ))}
          </Select>
        </div>

        {isBot && (
          <span style={{ fontSize: 12, color: "#aaa" }}>Бот работает только на поле 3×3</span>
        )}

        <Button size="small" type="primary" onClick={() => startGame()}>
          Применить
        </Button>
      </div>

      {/* ── Статус ─────────────────────────────────────────────────────────── */}
      <div style={{ ...styles.localStatus, color: statusColor }}>
        {statusText}
      </div>

      {/* ── Игровое поле ───────────────────────────────────────────────────── */}
      <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
          gap: 6,
        }}>
          {board.map((cell, i) => {
            const isEmpty = cell === TicTacToeChars.empty;
            const isX = cell === TicTacToeChars.cross;
            return (
              <div
                key={i}
                onClick={() => handleClick(i)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  border: "2px solid #d0d0d0",
                  borderRadius: 8,
                  fontSize: Math.floor(cellSize * 0.6),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: isEmpty && !isOver && !isBotTurn ? "pointer" : "default",
                  background: isEmpty ? "#fafafa" : isX ? "#e8f0ff" : "#fff0f0",
                  userSelect: "none",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                  transition: "background 0.15s",
                  opacity: isBotTurn ? 0.75 : 1,
                  color: isX ? "#1677ff" : "#ff4d4f",
                  fontWeight: 700,
                }}
              >
                {getSymbol(cell)}
              </div>
            );
          })}
        </div>

        {winningLine && (
          <DrawWinLine
            winningLine={winningLine}
            size={size}
            cellSize={cellSize}
            gap={6}
            strokeWidth={5}
            stroke="#52c41a"
            strokeLinecap="round"
          />
        )}
      </div>

      {/* ── Кнопки ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Button type="primary" onClick={() => startGame()}>
          {isOver ? "Сыграть ещё раз" : "Начать заново"}
        </Button>
        <Button onClick={onExit}>← В меню</Button>
      </div>
    </div>
  );
};

export default LocalGame;