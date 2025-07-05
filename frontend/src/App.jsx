import React, { useEffect, useState, useCallback } from "react";
import ChessBoard from "./components/ChessBoard";
import MoveHistory from "./components/MoveHistory";
import "./App.css";
import { PIECE_UNICODE } from "./components/ChessBoard";

// Helper to count pieces from a FEN string
function countPiecesFromFEN(fen) {
  const pieceCounts = { P: 0, N: 0, B: 0, R: 0, Q: 0, K: 0, p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
  const boardPart = fen.split(" ")[0];
  for (const c of boardPart) {
    if (pieceCounts.hasOwnProperty(c)) pieceCounts[c]++;
  }
  return pieceCounts;
}

const INITIAL_PIECES = { P: 8, N: 2, B: 2, R: 2, Q: 1, K: 1, p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };

export default function App() {
  const [boardData, setBoardData] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [captured, setCaptured] = useState({ white: {}, black: {} });

  // Fetch board state
  const fetchBoard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/board");
      if (!res.ok) throw new Error("Backend error: /api/board");
      const data = await res.json();
      setBoardData(data);
    } catch (err) {
      setError("Could not connect to backend. Is it running? (python backend/app.py)");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch move history and last move
  const fetchGameStatus = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/game-status");
      if (!res.ok) throw new Error("Backend error: /api/game-status");
      const data = await res.json();
      setMoveHistory(data.move_history || []);
      setLastMove(data.last_move || null);
    } catch (err) {
      setError("Could not connect to backend. Is it running? (python backend/app.py)");
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchBoard();
    fetchGameStatus();
  }, [fetchBoard, fetchGameStatus]);

  // Update captured pieces after boardData changes
  useEffect(() => {
    if (!boardData) return;
    const current = countPiecesFromFEN(boardData.fen);
    const white = {};
    const black = {};
    // White's captured = initial black - current black
    for (const piece of ["p", "n", "b", "r", "q"]) {
      const diff = INITIAL_PIECES[piece] - (current[piece] || 0);
      if (diff > 0) white[piece] = diff;
    }
    // Black's captured = initial white - current white
    for (const piece of ["P", "N", "B", "R", "Q"]) {
      const diff = INITIAL_PIECES[piece] - (current[piece] || 0);
      if (diff > 0) black[piece] = diff;
    }
    setCaptured({ white, black });
  }, [boardData]);

  // Make a move
  const handleMove = async (from, to) => {
    const move = from + to;
    setError(null);
    try {
      const res = await fetch("/api/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ move }),
      });
      if (!res.ok) throw new Error("Invalid move");
      await fetchBoard();
      await fetchGameStatus();
    } catch (err) {
      setError(err.message || "Move failed");
    }
  };

  // New game
  const handleNewGame = async () => {
    setError(null);
    try {
      await fetch("/api/new-game");
      await fetchBoard();
      await fetchGameStatus();
    } catch (err) {
      setError("Could not start new game. Backend may be down.");
    }
  };

  // Take back
  const handleTakeback = async () => {
    setError(null);
    try {
      const res = await fetch("/api/takeback", { method: "POST" });
      if (!res.ok) throw new Error("No moves to take back");
      await fetchBoard();
      await fetchGameStatus();
    } catch (err) {
      setError(err.message || "Takeback failed");
    }
  };

  if (loading) {
    return <div className="loading">Loading ChessMate...</div>;
  }

  if (error) {
    return <div className="loading" style={{ color: '#b00', fontWeight: 'bold' }}>{error}</div>;
  }

  if (!boardData) {
    return <div className="loading">Unable to load board data.</div>;
  }

  return (
    <div className="app-container">
      <header>
        <h1>ChessMate</h1>
        <button className="new-game-btn" onClick={handleNewGame}>
          New Game
        </button>
      </header>
      <div className="main-content-captured">
        <div className="captured-row captured-row-white">
          <CapturedPiecesRow pieces={captured.white} color="white" />
        </div>
        <div className="main-content">
          <ChessBoard
            boardData={boardData}
            onMove={handleMove}
            lastMove={lastMove}
          />
          <MoveHistory moves={moveHistory} />
        </div>
        <div className="captured-row captured-row-black">
          <CapturedPiecesRow pieces={captured.black} color="black" />
        </div>
        <div className="takeback-btn-row">
          <button className="takeback-btn" onClick={handleTakeback}>
            Take Back
          </button>
        </div>
      </div>
    </div>
  );
}

function CapturedPiecesRow({ pieces, color }) {
  // PIECE_UNICODE is imported from ChessBoard.jsx
  const order = color === "white" ? ["p", "n", "b", "r", "q"] : ["P", "N", "B", "R", "Q"];
  const style = { color: color === "black" ? "#222" : "#fff" };
  return (
    <div className="captured-pieces-row" style={style}>
      {order.map((piece) =>
        pieces[piece] ? (
          <span key={piece} className="captured-piece">
            {PIECE_UNICODE[piece]}{pieces[piece] > 1 ? <span className="captured-count">{pieces[piece]}</span> : null}
          </span>
        ) : null
      )}
    </div>
  );
} 