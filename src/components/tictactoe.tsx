import React, { useState } from "react";
import { Button } from "antd";

type Player = "X" | "O" | null;

const TicTacToe: React.FC = () => {
	const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
	const [isX, setIsX] = useState(true);

	const winner = calculateWinner(board);

	const handleClick = (index: number) => {
		if (board[index] || winner) return;

		const newBoard = [...board];
		newBoard[index] = isX ? "X" : "O";

		setBoard(newBoard);
		setIsX(!isX);
	};

	const reset = () => {
		setBoard(Array(9).fill(null));
		setIsX(true);
	};

	return (
		<div style={{ textAlign: "center" }}>
			<h2>Крестики-нолики</h2>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(3, 80px)",
					gap: 8,
					justifyContent: "center",
					marginBottom: 16,
				}}
			>
				{board.map((cell, i) => (
					<div
						key={i}
						onClick={() => handleClick(i)}
						style={{
							width: 80,
							height: 80,
							border: "1px solid #333",
							fontSize: 32,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							background: "#fff",
						}}
					>
						{cell}
					</div>
				))}
			</div>

			<h3>
				{winner
					? `Победитель: ${winner}`
					: board.every(Boolean)
						? "Ничья"
						: `Ход: ${isX ? "X" : "O"}`}
			</h3>

			<Button onClick={reset}>Сброс</Button>
		</div>
	);
};

function calculateWinner(board: Player[]): Player {
	const lines = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8],
		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8],
		[0, 4, 8],
		[2, 4, 6],
	];

	for (const [a, b, c] of lines) {
		if (board[a] && board[a] === board[b] && board[a] === board[c]) {
			return board[a];
		}
	}

	return null;
}

export default TicTacToe;
