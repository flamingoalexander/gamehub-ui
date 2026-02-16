import React, { useEffect, useState, useRef } from "react";
import { Button } from "antd";
import SeaBattle from "./scripts/SeaBattle/SeaBattle";
import Ship from "./scripts/SeaBattle/Ship";
import SeaBattlePlayer from "./scripts/SeaBattle/SeaBattlePlayer";

const SIZE = 8;
const shipLengths = [4, 3, 2, 2, 1];
const TOTAL_CELLS = shipLengths.reduce((a, b) => a + b, 0);

const Battleship: React.FC = () => {
	const playerGameRef = useRef<SeaBattle | null>(null);
	const computerGameRef = useRef<SeaBattle | null>(null);
	const [playerHits, setPlayerHits] = useState<boolean[][]>([]);
	const [computerHits, setComputerHits] = useState<boolean[][]>([]);
	const [playerHitsCount, setPlayerHitsCount] = useState(0);
	const [computerHitsCount, setComputerHitsCount] = useState(0);
	const [playerShots, setPlayerShots] = useState(0);
	const [computerShots, setComputerShots] = useState(0);
	const [placingShips, setPlacingShips] = useState<number[]>([]);
	const [isHorizontal, setIsHorizontal] = useState(true);
	const [turn, setTurn] = useState<"player" | "computer">("player");
	const [gameStarted, setGameStarted] = useState(false);

	useEffect(() => {
		resetGame();
	}, []);

	useEffect(() => {
		if (turn === "computer" && gameStarted && !playerWin && !computerWin) {
			computerShoot();
		}
	}, [turn]);

	const resetGame = () => {
		// Player's board: ships placed by human, attacked by computer
		const playerField: (Ship | undefined)[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(undefined));
		const playerGame = new SeaBattle(playerField);
		const computerAttacker = new SeaBattlePlayer(new Set<Ship>(), playerGame);
		const humanDefender = new SeaBattlePlayer(new Set<Ship>(), playerGame);
		playerGame.players = [computerAttacker, humanDefender]; // winner is players[0] = computerAttacker if gameOver

		humanDefender.hasAnyShip = function (): boolean {
			return [...this.ships].some((ship) => !ship.isDestroyed);
		};

		playerGame.destroyShip = function (row: number, column: number) {
			const shipToDestroy = this.field[row][column];
			if (shipToDestroy == undefined) throw "Empty cell";
			if (shipToDestroy.isDestroyed == true) throw "Ship already destroyed";
			(shipToDestroy as any).hitCount = ((shipToDestroy as any).hitCount || 0) + 1;
			if ((shipToDestroy as any).hitCount >= shipToDestroy.size) {
				shipToDestroy.isDestroyed = true;
			}
			if (!shipToDestroy.placedBy.hasAnyShip()) this.gameState = 2;
		};

		playerGameRef.current = playerGame;

		// Computer's board: ships placed by computer, attacked by human
		const computerField: (Ship | undefined)[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(undefined));
		const computerGame = new SeaBattle(computerField);
		const humanAttacker = new SeaBattlePlayer(new Set<Ship>(), computerGame);
		const computerDefender = new SeaBattlePlayer(new Set<Ship>(), computerGame);
		computerGame.players = [humanAttacker, computerDefender]; // winner is players[0] = humanAttacker if gameOver

		computerDefender.hasAnyShip = function (): boolean {
			return [...this.ships].some((ship) => !ship.isDestroyed);
		};

		computerGame.destroyShip = function (row: number, column: number) {
			const shipToDestroy = this.field[row][column];
			if (shipToDestroy == undefined) throw "Empty cell";
			if (shipToDestroy.isDestroyed == true) throw "Ship already destroyed";
			(shipToDestroy as any).hitCount = ((shipToDestroy as any).hitCount || 0) + 1;
			if ((shipToDestroy as any).hitCount >= shipToDestroy.size) {
				shipToDestroy.isDestroyed = true;
			}
			if (!shipToDestroy.placedBy.hasAnyShip()) this.gameState = 2;
		};

		// Place computer ships randomly
		placeRandomShips(computerGame, computerDefender, shipLengths);

		computerGameRef.current = computerGame;

		setPlayerHits(Array.from({ length: SIZE }, () => Array(SIZE).fill(false)));
		setComputerHits(Array.from({ length: SIZE }, () => Array(SIZE).fill(false)));
		setPlayerHitsCount(0);
		setComputerHitsCount(0);
		setPlayerShots(0);
		setComputerShots(0);
		setPlacingShips(shipLengths.slice());
		setIsHorizontal(true);
		setTurn("player");
		setGameStarted(false);
	};

	const placeRandomShips = (game: SeaBattle, player: SeaBattlePlayer, lengths: number[]) => {
		for (const length of lengths) {
			let placed = false;
			while (!placed) {
				const horiz = Math.random() < 0.5;
				const r = Math.floor(Math.random() * SIZE);
				const c = Math.floor(Math.random() * SIZE);
				let canPlace = true;
				for (let i = 0; i < length; i++) {
					const pr = r + (horiz ? 0 : i);
					const pc = c + (horiz ? i : 0);
					if (pr >= SIZE || pc >= SIZE || game.field[pr][pc] !== undefined) {
						canPlace = false;
						break;
					}
				}
				if (canPlace) {
					const ship = new Ship(length, player);
					(ship as any).hitCount = 0;
					player.ships.add(ship);
					for (let i = 0; i < length; i++) {
						const pr = r + (horiz ? 0 : i);
						const pc = c + (horiz ? i : 0);
						game.placeShip(ship, pr, pc);
					}
					placed = true;
				}
			}
		}
	};

	const playerBoardClick = (r: number, c: number) => {
		if (placingShips.length > 0) {
			const length = placingShips[0];
			const horiz = isHorizontal;
			let canPlace = true;
			for (let i = 0; i < length; i++) {
				const pr = r + (horiz ? 0 : i);
				const pc = c + (horiz ? i : 0);
				if (pr >= SIZE || pc >= SIZE || playerGameRef.current?.field[pr]?.[pc] !== undefined) {
					canPlace = false;
					break;
				}
			}
			if (canPlace) {
				const ship = new Ship(length, playerGameRef.current?.players[1]!); // humanDefender
				(ship as any).hitCount = 0;
				playerGameRef.current?.players[1].ships.add(ship);
				for (let i = 0; i < length; i++) {
					const pr = r + (horiz ? 0 : i);
					const pc = c + (horiz ? i : 0);
					playerGameRef.current?.placeShip(ship, pr, pc);
				}
				setPlacingShips((prev) => prev.slice(1));
				if (placingShips.length === 1) {
					playerGameRef.current?.startGame();
					computerGameRef.current?.startGame();
					setGameStarted(true);
				}
			}
		}
	};

	const opponentBoardClick = (r: number, c: number) => {
		if (placingShips.length > 0 || !gameStarted || turn !== "player") return;
		if (playerHits[r][c]) return;

		const newPlayerHits = playerHits.map((row) => row.slice());
		newPlayerHits[r][c] = true;
		setPlayerHits(newPlayerHits);

		const ship = computerGameRef.current?.field[r][c];
		if (ship !== undefined) {
			try {
				computerGameRef.current?.destroyShip(r, c);
				setPlayerHitsCount((h) => h + 1);
			} catch (e) {}
		}

		setPlayerShots((s) => s + 1);

		if (computerGameRef.current?.gameState !== 2) {
			setTurn("computer");
		}
	};

	const computerShoot = () => {
		let shot = false;
		while (!shot) {
			const r = Math.floor(Math.random() * SIZE);
			const c = Math.floor(Math.random() * SIZE);
			if (!computerHits[r][c]) {
				const newComputerHits = computerHits.map((row) => row.slice());
				newComputerHits[r][c] = true;
				setComputerHits(newComputerHits);

				const ship = playerGameRef.current?.field[r][c];
				if (ship !== undefined) {
					try {
						playerGameRef.current?.destroyShip(r, c);
						setComputerHitsCount((h) => h + 1);
					} catch (e) {}
				}

				setComputerShots((s) => s + 1);
				shot = true;
			}
		}
		if (playerGameRef.current?.gameState !== 2) {
			setTurn("player");
		}
	};

	const placing = placingShips.length > 0;
	const playerWin = computerGameRef.current?.gameState === 2;
	const computerWin = playerGameRef.current?.gameState === 2;

	return (
		<div style={{ textAlign: "center" }}>
			<h2>🚢 Морской бой</h2>
			{placing && placingShips[0] && <h3>Разместите корабль длины {placingShips[0]}</h3>}
			{placing && (
				<Button onClick={() => setIsHorizontal(!isHorizontal)}>
					Переключить на {isHorizontal ? "Вертикально" : "Горизонтально"}
				</Button>
			)}

			<div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
				<div>
					<h3>Ваше поле</h3>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: `repeat(${SIZE}, 40px)`,
							gap: 4,
							marginBottom: 16,
						}}
					>
						{Array.from({ length: SIZE }).map((_, r) =>
							Array.from({ length: SIZE }).map((_, c) => (
								<div
									key={`${r}-${c}-player`}
									onClick={() => playerBoardClick(r, c)}
									style={{
										width: 40,
										height: 40,
										border: "1px solid #333",
										cursor: placing ? "pointer" : "default",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										background: computerHits[r]?.[c]
											? playerGameRef.current?.field[r]?.[c]
												? "#52c41a"
												: "#ff4d4f"
											: playerGameRef.current?.field[r]?.[c]
											? "#a0d911"
											: "#1890ff",
										color: "#fff",
										fontWeight: "bold",
									}}
								>
									{computerHits[r]?.[c]
										? playerGameRef.current?.field[r]?.[c]
											? "💥"
											: "•"
										: playerGameRef.current?.field[r]?.[c]
										? "🚢"
										: ""}
								</div>
							)),
						)}
					</div>
				</div>
				<div>
					<h3>Поле противника</h3>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: `repeat(${SIZE}, 40px)`,
							gap: 4,
							marginBottom: 16,
						}}
					>
						{Array.from({ length: SIZE }).map((_, r) =>
							Array.from({ length: SIZE }).map((_, c) => (
								<div
									key={`${r}-${c}-opponent`}
									onClick={() => opponentBoardClick(r, c)}
									style={{
										width: 40,
										height: 40,
										border: "1px solid #333",
										cursor: !placing && gameStarted && turn === "player" ? "pointer" : "default",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										background: playerHits[r]?.[c]
											? computerGameRef.current?.field[r]?.[c]
												? "#52c41a"
												: "#ff4d4f"
											: "#1890ff",
										color: "#fff",
										fontWeight: "bold",
									}}
								>
									{playerHits[r]?.[c]
										? computerGameRef.current?.field[r]?.[c]
											? "💥"
											: "•"
										: ""}
								</div>
							)),
						)}
					</div>
				</div>
			</div>

			{!placing && (
				<>
					<h3>
						Ваши попадания: {playerHitsCount} / {TOTAL_CELLS}
					</h3>
					<h3>Ваши выстрелы: {playerShots}</h3>
					<h3>
						Попадания противника: {computerHitsCount} / {TOTAL_CELLS}
					</h3>
					<h3>Выстрелы противника: {computerShots}</h3>
				</>
			)}

			{playerWin && <h2 style={{ color: "green" }}>Победа! 🎉</h2>}
			{computerWin && <h2 style={{ color: "red" }}>Поражение! 😞</h2>}

			<Button onClick={resetGame}>Новая игра</Button>
		</div>
	);
};

export default Battleship;