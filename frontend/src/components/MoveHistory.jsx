import React from "react";

export default function MoveHistory({ moves }) {
  return (
    <div className="move-history">
      <h2>Move History</h2>
      {moves.length === 0 ? (
        <div className="history-placeholder">No moves yet</div>
      ) : (
        <ol>
          {moves.map((move, idx) => (
            <li key={idx}>{move}</li>
          ))}
        </ol>
      )}
    </div>
  );
} 