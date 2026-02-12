import Point from "./Point";

function pointToString(point: Point) : string
{
    return `${point.row},${point.column}`
}

export default pointToString