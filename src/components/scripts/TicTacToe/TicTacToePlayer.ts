import TicTacToeGame from "./TicTacToeGame";
import Point from "./Point";
import TicTacToeChars from "./TicTacToeCharsEnum";

class TicTacToePlayer
{
    value: TicTacToeChars
    game: TicTacToeGame
    name: string
    moves: Set<string>

    constructor(value: TicTacToeChars, game: TicTacToeGame, name: string)
    {
        this.value = value;
        this.game = game;
        this.name = name;
        this.moves = new Set<string>;
        game.addPlayer(this);
    }

    makeMove(point: Point)
    {
        this.game.makeMoveByPlayer(point, this)
    }

    saveMove(move: Point)
    {
        this.moves.add(`${move.row},${move.column}`);
    }

    getMoves(): Set<string>
    {
        return new Set(this.moves);
    }
}

export default TicTacToePlayer