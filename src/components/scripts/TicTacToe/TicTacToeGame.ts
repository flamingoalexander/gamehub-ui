import TicTacToePlayer from "./TicTacToePlayer";
import WinnerChecker from "./WinnerChecker";
import Point from "./Point"
import TicTacToeChars from "./TicTacToeCharsEnum";
import GameStates from "./TicTacToeGameStates";

class TicTacToeGame
{
    field: Array<Array<TicTacToeChars>>
    players: Array<TicTacToePlayer>
    emptyCharsCount: number
    winnerChecker: WinnerChecker
    valuesToWin: number
    isGameOver: boolean
    gameState: GameStates

    constructor(field: Array<Array<TicTacToeChars>>, valuesToWin: number, winnerChecker: WinnerChecker)
    {
        this.field = field;
        this.players = [];
        this.emptyCharsCount = field.length * field[0].length;
        this.winnerChecker = winnerChecker;
        this.gameState = GameStates.onGoing;
        this.valuesToWin = valuesToWin;
        this.isGameOver = false;
    }

    addPlayer(player: TicTacToePlayer)
    {
        this.players.push(player);
    }

    getFieldCopy() : TicTacToeChars[][]
    {
        let fieldCopy: TicTacToeChars[][] = [];
        for (let i = 0; i < this.field.length; i++)
        {
            fieldCopy.push([...this.field[i]]);
        }
        return fieldCopy;
    }

    makeMoveByPlayer(point: Point, playerMakingMove: TicTacToePlayer)
    {
        let row = point.row;
        let column = point.column;

        if (this.isGameOver == true)
            throw "Game is over";
        let currentPlayer = this.players[0];
        if (playerMakingMove != currentPlayer)
            throw "It's not your turn";
        if (this.field[row][column] != TicTacToeChars.empty)
            throw "Field is not empty";

        this.field[row][column] = playerMakingMove.value;
        currentPlayer.saveMove(point);
        this.emptyCharsCount--;
        this.defineGameResult(currentPlayer)
        this.isGameOver = this.gameState != GameStates.onGoing;
        if (this.isGameOver == false)
            this.switchPlayer();
    }

    defineGameResult(currentPlayer: TicTacToePlayer)
    {
        if (this.winnerChecker.checkWinner(currentPlayer.moves))
            this.gameState = GameStates.hasWinner;
        else if (this.checkDraw())
            this.gameState = GameStates.draw;
    }

    getWinner()
    {
        if (this.gameState != GameStates.hasWinner)
            throw "There is no winner";
        return this.players[0];
    }

    switchPlayer()
    {
        let currentPlayer = this.players.shift();
        if (currentPlayer != undefined)
            this.players.push(currentPlayer);
        else
            throw "Player cannot be undefined"
    }

    checkDraw() : boolean
    {
        return this.emptyCharsCount == 0;
    }
}

export default TicTacToeGame