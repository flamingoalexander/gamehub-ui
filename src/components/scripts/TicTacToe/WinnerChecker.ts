import Point from "./Point";
import pointToString from "./pointToString";

enum Lines
{
    vertical,
    horizontal,
    mainDiagonal,
    antiDiagonal
}

class WinnerChecker
{
    valuesToWin: number

    constructor(valuesToWin: number)
    {
        this.valuesToWin = valuesToWin;
    }

    checkWinner(playerMoves: Set<string>) 
    {
        let valuesToWin = this.valuesToWin;

        return this.linesCheck(playerMoves, valuesToWin, Lines.vertical) ||
               this.linesCheck(playerMoves, valuesToWin, Lines.horizontal) ||
               this.linesCheck(playerMoves, valuesToWin, Lines.mainDiagonal) ||
               this.linesCheck(playerMoves, valuesToWin, Lines.antiDiagonal);
    }


    linesCheck(playerMoves: Set<string>, valuesToWin: number, currentLine: Lines): boolean
    {
        for (let move of playerMoves)
        {
            let [row, column] = move.split(",").map(Number);

            let isWin = true;

            for (let i = 1; i < valuesToWin; i++)
            {
                let coordToCheck: Point;

                if (currentLine === Lines.horizontal)
                    coordToCheck = new Point(row, column + i);
                else if (currentLine === Lines.vertical)
                    coordToCheck = new Point(row + i, column);
                else if (currentLine === Lines.mainDiagonal)
                    coordToCheck = new Point(row + i, column + i);
                else
                    coordToCheck = new Point(row + i, column - i);

                if (!playerMoves.has(pointToString(coordToCheck)))
                {
                    isWin = false;
                    break;
                }
            }

            if (isWin) 
                return true;
        }
        return false;
    }
}

export default WinnerChecker;