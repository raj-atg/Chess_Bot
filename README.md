# ChessMate

A simple, minimal chess application with a Python Flask backend and a React frontend. Play chess against a basic AI, view move history, and start new games. Designed for clarity and ease of use.

---

## Features
- Interactive chessboard (Unicode pieces)
- Click-to-move functionality
- Move history display
- New Game button
- Take Back button
- Minimal, clean UI
- No Stockfish, no WebSockets, no sound, no advanced analysis

---

## Chess Logic
- Uses the [python-chess](https://python-chess.readthedocs.io/) library for all move validation, legal move generation, and game state management.
- The backend maintains a single game state in memory.
- The AI makes random legal moves, preferring captures at higher difficulty levels.
- Move history is stored and displayed in standard algebraic notation (SAN).
- Supports take back (undo last move) functionality.

---

## Architecture

### Backend (Python Flask)
- **Flask** for REST API
- **python-chess** for chess logic
- Simple random/capture-based AI (no Stockfish)
- Endpoints for new game, making moves, getting board state, move history, and take back

### Frontend (React)
- **React** for UI
- Unicode chess pieces (no SVGs/images)
- Move history and new game/take back buttons
- Minimal CSS for layout and board

---

## API Endpoints

| Method | Endpoint         | Description                |
|--------|------------------|----------------------------|
| GET    | /api/new-game    | Start new game             |
| POST   | /api/move        | Player move (UCI or SAN)   |
| GET    | /api/board       | Current board state (FEN)  |
| GET    | /api/game-status | Move history & status      |
| POST   | /api/takeback    | Undo last move             |

---

## Setup & Running

### 1. Quick Start with Batch Script
- In the project root, run:
  ```sh
  .\start.bat
  ```
- This will start both the backend and frontend in separate terminals.
- Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Manual Setup
- Backend:
  ```sh
  pip install -r requirements.txt
  python backend/app.py
  ```
- Frontend:
  ```sh
  cd frontend
  npm install
  npm run dev
  ```

---

## File Structure
```
Chess_Bot/
├── backend/
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── App.css
│   │   └── components/
│   │       ├── ChessBoard.jsx
│   │       └── MoveHistory.jsx
│   └── package.json
├── start.bat
└── README.md
```

---

## Future Improvements
- **Stockfish Integration**: Add support for playing against the Stockfish chess engine with multiple difficulty levels.
- **Multiplayer Support**: Add real-time play with Flask-SocketIO.
- **Analysis Mode**: Engine evaluation and move suggestions.
- **UI Enhancements**: Animations, themes, and more responsive design.

---

## Credits
- [python-chess](https://python-chess.readthedocs.io/)
- [React](https://react.dev/)

---

## License
MIT 