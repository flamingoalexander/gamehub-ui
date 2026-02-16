import React from "react";
import Point from "./scripts/TicTacToe/Point";

const WinLine: React.FC<{
  winningLine: Point[];
  size: number;
  cellSize: number;
  gap: number;
  strokeWidth: number;
  stroke: string;
  strokeLinecap: "inherit" | "round" | "butt" | "square";
}> = ({ winningLine, size, cellSize, gap, strokeWidth, stroke, strokeLinecap }) => {
  if (!winningLine || winningLine.length === 0) {
    return null;
  }

  // Calculate total dimensions including gaps
  const totalSize = size * cellSize + (size - 1) * gap;

  // Compute pixel-based center positions for start and end of the line
  const getCenter = (index: number) => index * (cellSize + gap) + cellSize / 2;

  const start = winningLine[0];
  const end = winningLine[winningLine.length - 1];

  const x1 = getCenter(start.column);
  const y1 = getCenter(start.row);
  const x2 = getCenter(end.column);
  const y2 = getCenter(end.row);

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap={strokeLinecap}
      />
    </svg>
  );
};

export default WinLine;