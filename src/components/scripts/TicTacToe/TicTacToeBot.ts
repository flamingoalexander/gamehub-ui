import Point from "./Point";
import TicTacToeChars from "./TicTacToeCharsEnum";
import TicTacToeGame from "./TicTacToeGame";
import TicTacToePlayer from "./TicTacToePlayer";
import WinnerChecker from "./WinnerChecker";

enum GameResults
{
    win,
    lose,
    draw
}

class TicTacToeBot
{
    moves: Set<string>
    game: TicTacToeGame
    value: TicTacToeChars
    opponent: TicTacToePlayer
    winnerChecker: WinnerChecker
    scores: Map<GameResults, number>

    constructor(game: TicTacToeGame, value: TicTacToeChars, winnerChecker: WinnerChecker, opponent: TicTacToePlayer)
    {
        this.moves = new Set();
        this.opponent = opponent
        this.value = value;
        this.winnerChecker = winnerChecker;
        this.game = game;
        this.scores = new Map<GameResults, number>([
            [GameResults.win, 10],
            [GameResults.lose, -10],
            [GameResults.draw, 0]]
        );
    }

    isDraw(field: TicTacToeChars[][]) : boolean
    {
        for (let i = 0; i < field.length; i++)
        {
            for (let j = 0; j < field[i].length; j++)
            {
                if (field[i][j] == TicTacToeChars.empty)
                    return false;
            }
        }
        return true;
    }

    saveMove(move: string)
    {
        this.moves.add(move);
    }

    findBestMove(): Point
    {
        let field = this.game.getFieldCopy();
        let best_score = -Infinity;
        let bestMove = new Point(-1, -1);
        let player = {moves: new Set([...this.opponent.getMoves()]), value: this.opponent.value};
        let bot = {moves: new Set([...this.moves]), value: this.value};
        let emptyChar = TicTacToeChars.empty;
        let botMoves = bot.moves;
        for (let i = 0; i < field.length; i++)
        {
            for (let j = 0; j < field[0].length; j++)
            {
                if (field[i][j] != emptyChar)
                    continue;
                field[i][j] = this.value;
                let pointString = `${i},${j}`;
                botMoves.add(pointString)
                let score = this.minimax(field, 0, false, player, bot);
                field[i][j] = emptyChar;
                botMoves.delete(pointString)
                if (score > best_score)
                {
                    best_score = score;
                    bestMove = new Point(i,j);
                }
            }
        }
        return bestMove;
    }

    minimax(field: TicTacToeChars[][], depth: number, isMaximizing: boolean, opponent: {moves: Set<string>, value: TicTacToeChars}, bot: {moves: Set<string>, value: TicTacToeChars}) : number
    {
        let scores = this.scores;
        let winnerChecker = this.winnerChecker;
        if (winnerChecker.checkWinner(bot.moves))
            return scores.get(GameResults.win)! - depth;
        else if (winnerChecker.checkWinner(opponent.moves))
            return scores.get(GameResults.lose)! + depth;
        else if (this.isDraw(field))
            return scores.get(GameResults.draw)!;
        let bestScore = isMaximizing ? -Infinity : Infinity;
        let makingMove = isMaximizing ? bot : opponent;
        let minMaxFunc = isMaximizing ? Math.max : Math.min;
        for (let i = 0; i < field.length; i++)
        {
            for (let j = 0; j < field[0].length; j++)
            {
                if (field[i][j] != TicTacToeChars.empty)
                    continue;
                field[i][j] = makingMove.value;
                makingMove.moves.add(`${i},${j}`);
                let score = this.minimax(field, depth + 1, !isMaximizing, opponent, bot);
                field[i][j] = TicTacToeChars.empty;
                makingMove.moves.delete(`${i},${j}`);
                bestScore = minMaxFunc(score, bestScore)
            }
        }
        return bestScore;
    }
}

export default TicTacToeBot