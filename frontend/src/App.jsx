import React, { useEffect, useState, useCallback } from "react";
import ChessBoard from "./components/ChessBoard";
import MoveHistory from "./components/MoveHistory";
import "./App.css";

export default function App() {
  const [boardData, setBoardData] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <button className="takeback-btn" onClick={handleTakeback}>
          Take Back
        </button>
      </header>
      <div className="main-content">
        <ChessBoard
          boardData={boardData}
          onMove={handleMove}
          lastMove={lastMove}
        />
        <MoveHistory moves={moveHistory} />
      </div>
    </div>
  );
} 