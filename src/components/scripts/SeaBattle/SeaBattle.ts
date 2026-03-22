import SeaBattlePlayer from "./SeaBattlePlayer";
import Ship from "./Ship";
import GameStates from "./GameStates";

class SeaBattle
{
    field: (Ship | undefined)[][]
    gameState: GameStates
    players: SeaBattlePlayer[]

    constructor(field: (Ship | undefined)[][])
    {
        this.field = field;
        this.gameState = GameStates.shipsPlacement
        this.players = [];
    }

    placeShip(ship: Ship, row: number, column: number)
    {
        let maxRowSize = this.field.length;
        let maxColumnSize = this.field[0].length;
        if (row >= maxRowSize || column >= maxColumnSize)
            throw "Ship out of field bounds";
        this.field[row][column] = ship;
    }

    startGame()
    {
        if (this.gameState != GameStates.shipsPlacement)
            throw "Game already started";
        this.gameState = GameStates.gameStart;
    }

    destroyShip(row: number, column: number)
    {
        let shipToDestroy = this.field[row][column];
        if (shipToDestroy == undefined)
            throw "Empty cell"
        if (shipToDestroy.isDestroyed == true)
            throw "Ship already destroyed"
        shipToDestroy.isDestroyed = true;
        if (shipToDestroy.placedBy.hasAnyShip())
            this.gameState = GameStates.gameOver;
    }

    tryGetWinner() : SeaBattlePlayer | undefined
    {
        if (this.gameState == GameStates.gameOver)
            return this.players[0];
        return undefined;
    }
}

export default SeaBattle;