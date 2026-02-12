import React, { useState, useEffect } from "react";
import { Button, Select } from "antd";

import TicTacToeGame from "./scripts/TicTacToe/TicTacToeGame";
import TicTacToePlayer from "./scripts/TicTacToe/TicTacToePlayer";
import WinnerChecker from "./scripts/TicTacToe/WinnerChecker";
import TicTacToeBot from "./scripts/TicTacToe/TicTacToeBot"; // бот поддерживается только для 3x3
import TicTacToeChars from "./scripts/TicTacToe/TicTacToeCharsEnum";
import Point from "./scripts/TicTacToe/Point"
import Column from "antd/es/table/Column";
import GameStates from "./scripts/TicTacToe/TicTacToeGameStates";

const TicTacToe: React.FC = () => {
  // Настройки
  const [pendingSize, setPendingSize] = useState<number>(3);
  const [pendingWinLength, setPendingWinLength] = useState<number>(3);
  const [vsBot, setVsBot] = useState<boolean>(false); // флаг игры с ботом (активен ТОЛЬКО когда поле 3x3)

  // Состояние игры
  const [size, setSize] = useState<number>(3);
  const [winLength, setWinLength] = useState<number>(3);

  const [game, setGame] = useState<TicTacToeGame>();
  const [playerX, setPlayerX] = useState<TicTacToePlayer>();
  const [playerO, setPlayerO] = useState<TicTacToePlayer>();
  const [bot, setBot] = useState<TicTacToeBot>();
  const [currentPlayer, setCurrentPlayer] = useState<TicTacToePlayer>();

  const [board, setBoard] = useState<TicTacToeChars[]>([]);

  const cellSize = Math.max(50, Math.floor(480 / size));

  // Инициализация игры
  const initGame = (newSize: number, newWinLength: number, playVsBot: boolean) => {
    // бот доступен только для 3x3
    const allowBot = newSize === 3;
    const useBot = playVsBot && allowBot;

    const newField = Array.from({ length: newSize }, () => Array(newSize).fill(TicTacToeChars.empty));

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

    setGame(newGame);
    setPlayerX(pX);
    setPlayerO(pO);
    setBot(botInstance);
    setCurrentPlayer(pX);
    setBoard(newField.flat());

    setSize(newSize);
    setWinLength(newWinLength);
    // если бот был запрещён из-за размера, отключаем флаг
    if (!allowBot) setVsBot(false);
  };

  // Первая инициализация
  useEffect(() => {
    initGame(3, 3, false);
  }, []);

  // Автоматический ход бота
  useEffect(() => {
    if (!vsBot || !bot || currentPlayer !== playerO || game?.isGameOver) return;

    const timeout = setTimeout(() => {
      if (bot && game && !game.isGameOver) {
        const bestMove = bot.findBestMove();
        playerO!.makeMove(bestMove);
        bot.saveMove(`${bestMove.row},${bestMove.column}`);
        setBoard(game.getFieldCopy().flat());
        setCurrentPlayer(playerX);
      }
    }, 450); // небольшая пауза, чтобы было видно «думание» бота

    return () => clearTimeout(timeout);
  }, [vsBot, bot, currentPlayer, game, playerX, playerO]);

  const handleClick = (index: number) => {
    if (!game || game.isGameOver || !currentPlayer) return;
    if (vsBot && currentPlayer === playerO) return; // защита от клика во время хода бота

    const row = Math.floor(index / size);
    const col = index % size;
    if (board[index] !== TicTacToeChars.empty) return;

    currentPlayer.makeMove(new Point(row, col));
    setBoard(game.getFieldCopy().flat());
    setCurrentPlayer(currentPlayer === playerX ? playerO : playerX);
  };

  const startNewGame = () => {
    const newS = pendingSize;
    const newW = Math.min(pendingWinLength, newS);
    // разрешаем включать бота ТОЛЬКО если выбран размер 3
    initGame(newS, newW, vsBot && newS === 3);
    setPendingWinLength(newW);
  };

  const isOver = game?.isGameOver ?? false;
  const hasWinner = isOver && game?.gameState == GameStates.hasWinner;
  const winner = hasWinner ? game?.getWinner() : null;

  const getPlayerName = (p: TicTacToePlayer | undefined) => (p?.name ?? "?");

  const status = isOver
    ? (winner ? `Победитель: ${getPlayerName(winner)}` : "Ничья")
    : `Ход: ${getPlayerName(currentPlayer)}`;

  const getSymbol = (cell: TicTacToeChars) => {
    if (cell === TicTacToeChars.cross) return "X";
    if (cell === TicTacToeChars.circle) return "O";
    return "";
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "sans-serif" }}>
      <h2>Крестики-нолики</h2>

      {/* Настройки */}
      <div style={{ marginBottom: 24, display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
        <div>
          <label>Размер поля: </label>
          <Select
            value={pendingSize}
            onChange={(v: number) => {
              setPendingSize(v);
              setPendingWinLength(prev => Math.min(prev, v));
              // если пользователь меняет размер и он становится не 3x3 — отключаем игру с ботом
              if (v !== 3) setVsBot(false);
            }}
            style={{ width: 90 }}
          >
            {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <Select.Option key={n} value={n}>{n}×{n}</Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <label>В ряд для победы: </label>
          <Select value={pendingWinLength} onChange={(v: number) => setPendingWinLength(v)} style={{ width: 90 }}>
            {Array.from({ length: pendingSize - 2 }, (_, i) => i + 3).map(n => (
              <Select.Option key={n} value={n}>{n}</Select.Option>
            ))}
          </Select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={vsBot}
            onChange={e => setVsBot(e.target.checked)}
            disabled={pendingSize !== 3} // доступность чекбокса только для 3x3
            title={pendingSize !== 3 ? "Бот доступен только для поля 3×3" : "Играть против бота"}
          />
          <label style={{ opacity: pendingSize !== 3 ? 0.6 : 1 }}>Играть против компьютера (бот за O)</label>
          {pendingSize !== 3 && <div style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>Бот работает только на поле 3×3</div>}
        </div>

        <Button type="primary" onClick={startNewGame}>
          Применить и начать заново
        </Button>
      </div>

      {/* Поле */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
          gap: 8,
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        {board.map((cell, i) => (
          <div
            key={i}
            onClick={() => handleClick(i)}
            style={{
              width: cellSize,
              height: cellSize,
              border: "2px solid #333",
              fontSize: Math.floor(cellSize * 0.7),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: (vsBot && currentPlayer === playerO) || isOver ? "default" : "pointer",
              background: "#fff",
              userSelect: "none",
              boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
              opacity: (vsBot && currentPlayer === playerO) ? 0.7 : 1,
            }}
          >
            {getSymbol(cell)}
          </div>
        ))}
      </div>

      <h3 style={{ minHeight: 42 }}>{status}</h3>

      <Button onClick={startNewGame} size="large">
        Сбросить игру
      </Button>
    </div>
  );
};

export default TicTacToe;