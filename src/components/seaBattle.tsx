import React, { useEffect, useState } from "react";
import { Button } from "antd";

const SIZE = 8;
const SHIPS = 5;

type Cell = {
	hasShip: boolean;
	hit: boolean;
};

const createBoard = (): Cell[][] => {
	const board: Cell[][] = Array.from({ length: SIZE }, () =>
		Array.from({ length: SIZE }, () => ({
			hasShip: false,
			hit: false,
		})),
	);

	// расставляем корабли
	let placed = 0;
	while (placed < SHIPS) {
		const r = Math.floor(Math.random() * SIZE);
		const c = Math.floor(Math.random() * SIZE);

		if (!board[r][c].hasShip) {
			board[r][c].hasShip = true;
			placed++;
		}
	}

	return board;
};

const Battleship: React.FC = () => {
	const [board, setBoard] = useState<Cell[][]>([]);
	const [hits, setHits] = useState(0);
	const [shots, setShots] = useState(0);

	useEffect(() => {
		resetGame();
	}, []);

	const resetGame = () => {
		setBoard(createBoard());
		setHits(0);
		setShots(0);
	};

	const shoot = (r: number, c: number) => {
		if (board[r][c].hit) return;

		const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
		newBoard[r][c].hit = true;

		if (newBoard[r][c].hasShip) {
			setHits((h) => h + 1);
		}

		setShots((s) => s + 1);
		setBoard(newBoard);
	};

	const win = hits === SHIPS;

	return (
		<div style={{ textAlign: "center" }}>
			<h2>🚢 Морской бой</h2>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: `repeat(${SIZE}, 40px)`,
					gap: 4,
					justifyContent: "center",
					marginBottom: 16,
				}}
			>
				{board.map((row, r) =>
					row.map((cell, c) => (
						<div
							key={`${r}-${c}`}
							onClick={() => shoot(r, c)}
							style={{
								width: 40,
								height: 40,
								border: "1px solid #333",
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								background: cell.hit
									? cell.hasShip
										? "#52c41a"
										: "#ff4d4f"
									: "#1890ff",
								fontWeight: "bold",
							}}
						>
							{cell.hit ? (cell.hasShip ? "💥" : "•") : ""}
						</div>
					)),
				)}
			</div>

			<h3>
				Попадания: {hits} / {SHIPS}
			</h3>
			<h3>Выстрелы: {shots}</h3>

			{win && <h2 style={{ color: "green" }}>Победа! 🎉</h2>}

			<Button onClick={resetGame}>Новая игра</Button>
		</div>
	);
};

export default Battleship;
