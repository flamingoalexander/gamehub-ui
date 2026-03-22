import { useState, useEffect } from "react";

import TicTacToeGame from "../scripts/TicTacToe/TicTacToeGame";
import TicTacToePlayer from "../scripts/TicTacToe/TicTacToePlayer";
import WinnerChecker from "../scripts/TicTacToe/WinnerChecker";
import TicTacToeBot from "../scripts/TicTacToe/TicTacToeBot";
import TicTacToeChars from "../scripts/TicTacToe/TicTacToeCharsEnum";
import Point from "../scripts/TicTacToe/Point";
import GameStates from "../scripts/TicTacToe/TicTacToeGameStates";

// ─── findWinningLine ──────────────────────────────────────────────────────────

export function findWinningLine(
  field: TicTacToeChars[][],
  symbol: TicTacToeChars,
  wl: number,
  s: number
): Point[] | null {
  // Горизонтали
  for (let row = 0; row < s; row++) {
    for (let col = 0; col <= s - wl; col++) {
      if (Array.from({ length: wl }, (_, k) => field[row][col + k]).every(c => c === symbol))
        return Array.from({ length: wl }, (_, k) => new Point(row, col + k));
    }
  }
  // Вертикали
  for (let col = 0; col < s; col++) {
    for (let row = 0; row <= s - wl; row++) {
      if (Array.from({ length: wl }, (_, k) => field[row + k][col]).every(c => c === symbol))
        return Array.from({ length: wl }, (_, k) => new Point(row + k, col));
    }
  }
  // Диагональ ↘
  for (let row = 0; row <= s - wl; row++) {
    for (let col = 0; col <= s - wl; col++) {
      if (Array.from({ length: wl }, (_, k) => field[row + k][col + k]).every(c => c === symbol))
        return Array.from({ length: wl }, (_, k) => new Point(row + k, col + k));
    }
  }
  // Диагональ ↙
  for (let row = 0; row <= s - wl; row++) {
    for (let col = wl - 1; col < s; col++) {
      if (Array.from({ length: wl }, (_, k) => field[row + k][col - k]).every(c => c === symbol))
        return Array.from({ length: wl }, (_, k) => new Point(row + k, col - k));
    }
  }
  return null;
}

// ─── useLocalGame hook ────────────────────────────────────────────────────────

export interface UseLocalGameOptions {
  vsBot: boolean;
  /** Вызывается при каждом изменении mode (нужен для авто-хода бота) */
  mode: string;
}

export interface UseLocalGameReturn {
  // Состояние
  game: TicTacToeGame | undefined;
  playerX: TicTacToePlayer | undefined;
  playerO: TicTacToePlayer | undefined;
  currentPlayer: TicTacToePlayer | undefined;
  board: TicTacToeChars[];
  winningLine: Point[] | null;
  size: number;
  winLength: number;
  isOver: boolean;
  winner: TicTacToePlayer | null;
  // Действия
  initGame: (size: number, winLength: number, p1Name: string, p2Name: string) => void;
  handleClick: (index: number) => void;
  getSymbol: (cell: TicTacToeChars) => string;
}

export function useLocalGame({ vsBot, mode }: UseLocalGameOptions): UseLocalGameReturn {
  const [game, setGame]                   = useState<TicTacToeGame>();
  const [playerX, setPlayerX]             = useState<TicTacToePlayer>();
  const [playerO, setPlayerO]             = useState<TicTacToePlayer>();
  const [bot, setBot]                     = useState<TicTacToeBot>();
  const [currentPlayer, setCurrentPlayer] = useState<TicTacToePlayer>();
  const [board, setBoard]                 = useState<TicTacToeChars[]>([]);
  const [winningLine, setWinningLine]     = useState<Point[] | null>(null);
  const [size, setSize]                   = useState<number>(3);
  const [winLength, setWinLength]         = useState<number>(3);

  const initGame = (newSize: number, newWinLength: number, p1Name: string, p2Name: string) => {
    const useBot = vsBot && newSize === 3;
    const newField = Array.from({ length: newSize }, () =>
      Array(newSize).fill(TicTacToeChars.empty)
    );
    const checker = new WinnerChecker(newWinLength);
    const newGame = new TicTacToeGame(newField, newWinLength, checker);
    const pX = new TicTacToePlayer(TicTacToeChars.cross, newGame, p1Name);
    let pO: TicTacToePlayer;
    let botInstance: TicTacToeBot | undefined;

    if (useBot) {
      pO = new TicTacToePlayer(TicTacToeChars.circle, newGame, "Компьютер");
      botInstance = new TicTacToeBot(newGame, TicTacToeChars.circle, checker, pX);
    } else {
      pO = new TicTacToePlayer(TicTacToeChars.circle, newGame, p2Name);
    }

    setGame(newGame);
    setPlayerX(pX);
    setPlayerO(pO);
    setBot(botInstance);
    setCurrentPlayer(pX);
    setBoard(newField.flat());
    setWinningLine(null);
    setSize(newSize);
    setWinLength(newWinLength);
  };

  // Авто-ход бота
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
    }, 450);
    return () => clearTimeout(timeout);
  }, [vsBot, bot, currentPlayer, game, playerX, playerO]);

  // Определение победной линии по завершении игры
  useEffect(() => {
    if (!game || !game.isGameOver || winningLine) return;
    if (game.gameState === GameStates.hasWinner) {
      const winnerSymbol = game.getWinner().value;
      const line = findWinningLine(game.field, winnerSymbol, winLength, size);
      setWinningLine(line);
    }
  }, [board, game, winLength, size, winningLine]);

  const handleClick = (index: number) => {
    if (!game || game.isGameOver || !currentPlayer) return;
    if (vsBot && currentPlayer === playerO) return;
    const row = Math.floor(index / size);
    const col = index % size;
    if (board[index] !== TicTacToeChars.empty) return;
    currentPlayer.makeMove(new Point(row, col));
    setBoard(game.getFieldCopy().flat());
    setCurrentPlayer(currentPlayer === playerX ? playerO : playerX);
  };

  const getSymbol = (cell: TicTacToeChars): string => {
    if (cell === TicTacToeChars.cross) return "X";
    if (cell === TicTacToeChars.circle) return "O";
    return "";
  };

  const isOver = game?.isGameOver ?? false;
  const hasWinner = isOver && game?.gameState === GameStates.hasWinner;
  const winner = hasWinner ? game!.getWinner() : null;

  return {
    game, playerX, playerO, currentPlayer,
    board, winningLine, size, winLength,
    isOver, winner,
    initGame, handleClick, getSymbol,
  };
}
