import SeaBattle from "./SeaBattle";
import Ship from "./Ship";

class SeaBattlePlayer
{
    ships: Set<Ship>
    game: SeaBattle

    constructor(ships: Set<Ship>, game: SeaBattle)
    {
        this.ships = ships;
        this.game = game;
    }

    placeShip(length: number, row: number, column: number)
    {
        this.game.placeShip(new Ship(length, this), row, column);
    }

    hasAnyShip() : boolean
    {
        return this.ships.size > 0;
    }
}

export default SeaBattlePlayer;