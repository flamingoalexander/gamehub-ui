class Point
{
    row: number
    column: number

    constructor(row: number, column: number)
    {
        this.row = row;
        this.column = column
    }

    equals(other: Point) : boolean
    {
        return this.row == other.row && this.column == other.column;
    }
}

export default Point
