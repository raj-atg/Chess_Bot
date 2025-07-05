import React, { useState } from 'react';

// Unicode chess symbols
export const PIECE_UNICODE = {
  'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
  'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
};

// Helper to parse FEN and return 2D array
function fenToBoard(fen) {
  const rows = fen.split(' ')[0].split('/');
  return rows.map(row => {
    const arr = [];
    for (const c of row) {
      if (isNaN(c)) arr.push(c);
      else arr.push(...Array(parseInt(c)).fill(null));
    }
    return arr;
  });
}

export default function ChessBoard({ boardData, onMove, lastMove }) {
  const [selected, setSelected] = useState(null); // {row, col}

  if (!boardData) return <div>Loading board...</div>;

  const board = fenToBoard(boardData.fen);

  // Convert (row, col) to algebraic square (e.g. e2)
  const toSquare = (row, col) => {
    return String.fromCharCode(97 + col) + (8 - row);
  };

  // Highlight last move squares
  let lastSquares = [];
  if (lastMove && lastMove.length >= 4) {
    lastSquares = [lastMove.slice(0, 2), lastMove.slice(2, 4)];
  }

  const handleSquareClick = (row, col) => {
    if (selected) {
      // Try to move
      const from = toSquare(selected.row, selected.col);
      const to = toSquare(row, col);
      if (from !== to) onMove(from, to);
      setSelected(null);
    } else if (board[row][col]) {
      setSelected({ row, col });
    }
  };

  return (
    <div className="chessboard">
      {board.map((rowArr, row) =>
        rowArr.map((piece, col) => {
          const square = toSquare(row, col);
          const isDark = (row + col) % 2 === 1;
          const isSelected = selected && selected.row === row && selected.col === col;
          const isLast = lastSquares.includes(square);
          return (
            <div
              key={square}
              className={`square${isDark ? " dark" : ""}${isSelected ? " selected" : ""}${isLast ? " last" : ""}`}
              onClick={() => handleSquareClick(row, col)}
            >
              {piece ? PIECE_UNICODE[piece] : ''}
            </div>
          );
        })
      )}
    </div>
  );
} 