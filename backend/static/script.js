// Cozy Chess - Optimized Performance Version

class CozyChess {
    constructor() {
        this.board = null;
        this.selectedSquare = null;
        this.gameState = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            turn: 'white',
            isCheck: false,
            isCheckmate: false,
            isStalemate: false,
            isDraw: false,
            legalMoves: [],
            moveHistory: []
        };
        this.difficulty = 5;
        this.engineType = 'simple_ai';
        
        this.initializeGame();
        this.setupEventListeners();
        this.loadEngineInfo();
    }

    initializeGame() {
        this.createBoard();
        this.updateBoard();
        this.hideLoading();
        this.loadGameState();
    }

    async loadEngineInfo() {
        try {
            const response = await fetch('/api/engine-info');
            const data = await response.json();
            this.engineType = data.engine_type;
            this.updateEngineStatus(data.message);
        } catch (error) {
            console.error('Failed to load engine info:', error);
        }
    }

    updateEngineStatus(message) {
        const engineBtn = document.getElementById('engineMoveBtn');
        if (engineBtn) {
            const icon = this.engineType === 'stockfish' ? '🤖' : '🎲';
            engineBtn.innerHTML = `<span class="btn-icon">${icon}</span>Engine Move (${this.engineType === 'stockfish' ? 'Stockfish' : 'Simple AI'})`;
        }
        
        // Add status to the page
        const statusDiv = document.createElement('div');
        statusDiv.className = 'engine-status';
        statusDiv.textContent = message;
        statusDiv.style.cssText = 'text-align: center; margin: 10px 0; padding: 8px; background: rgba(255, 176, 0, 0.1); border-radius: 6px; font-size: 0.9rem; color: #8B4513;';
        
        const header = document.querySelector('.app-header');
        if (header && !document.querySelector('.engine-status')) {
            header.appendChild(statusDiv);
        }
    }

    async loadGameState() {
        try {
            const response = await fetch('/api/board');
            const data = await response.json();
            this.updateGameState(data);
        } catch (error) {
            console.error('Failed to load game state:', error);
        }
    }

    createBoard() {
        const boardElement = document.getElementById('chessBoard');
        boardElement.innerHTML = '';

        for (let rank = 0; rank < 8; rank++) {
            for (let file = 0; file < 8; file++) {
                const square = document.createElement('div');
                const squareName = this.getSquareName(file, rank);
                
                square.className = `square ${(rank + file) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.square = squareName;
                square.dataset.file = file;
                square.dataset.rank = rank;
                
                square.addEventListener('click', (e) => this.handleSquareClick(e));
                
                boardElement.appendChild(square);
            }
        }
    }

    getSquareName(file, rank) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        return files[file] + ranks[rank];
    }

    updateBoard() {
        const squares = document.querySelectorAll('.square');
        
        squares.forEach(square => {
            const squareName = square.dataset.square;
            const piece = this.getPieceAtSquare(squareName);
            
            // Clear previous piece
            const existingPiece = square.querySelector('.piece');
            if (existingPiece) {
                existingPiece.remove();
            }
            
            // Add new piece if exists
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.className = 'piece';
                pieceElement.dataset.piece = piece;
                pieceElement.dataset.square = squareName;
                
                // Use Unicode chess symbols for faster loading
                pieceElement.textContent = this.getPieceSymbol(piece);
                
                square.appendChild(pieceElement);
            }
        });
        
        this.updateGameStatus();
    }

    getPieceAtSquare(squareName) {
        const fen = this.gameState.fen;
        const boardPart = fen.split(' ')[0];
        const ranks = boardPart.split('/');
        
        const file = squareName.charCodeAt(0) - 97;
        const rank = 8 - parseInt(squareName[1]);
        
        let pieceIndex = 0;
        for (let r = 0; r < rank; r++) {
            pieceIndex += this.countPiecesInRank(ranks[r]);
        }
        
        for (let f = 0; f < file; f++) {
            const char = ranks[rank][f];
            if (char && !isNaN(char)) {
                pieceIndex += parseInt(char);
            } else if (char) {
                pieceIndex++;
            }
        }
        
        const char = ranks[rank][file];
        if (char && isNaN(char)) {
            return this.getPieceSymbol(char);
        }
        
        return null;
    }

    countPiecesInRank(rank) {
        let count = 0;
        for (let char of rank) {
            if (isNaN(char)) {
                count++;
            } else {
                count += parseInt(char);
            }
        }
        return count;
    }

    getPieceSymbol(char) {
        const pieceMap = {
            'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
            'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
        };
        return pieceMap[char] || null;
    }

    handleSquareClick(event) {
        const square = event.target.closest('.square');
        if (!square) return;
        
        const squareName = square.dataset.square;
        
        if (this.selectedSquare) {
            this.makeMove(this.selectedSquare, squareName);
            this.clearSelection();
        } else {
            const piece = this.getPieceAtSquare(squareName);
            if (piece && this.isPieceOfCurrentPlayer(piece)) {
                this.selectSquare(squareName);
            }
        }
    }

    selectSquare(squareName) {
        this.clearSelection();
        this.selectedSquare = squareName;
        
        const square = document.querySelector(`[data-square="${squareName}"]`);
        square.classList.add('selected');
    }

    clearSelection() {
        if (this.selectedSquare) {
            const square = document.querySelector(`[data-square="${this.selectedSquare}"]`);
            if (square) {
                square.classList.remove('selected');
            }
        }
        
        document.querySelectorAll('.square').forEach(sq => {
            sq.classList.remove('selected');
        });
        
        this.selectedSquare = null;
    }

    async makeMove(fromSquare, toSquare) {
        const move = fromSquare + toSquare;
        
        try {
            const response = await fetch('/api/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ move: move })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.updateGameState(data);
            } else {
                console.error('Move failed:', data.error);
            }
        } catch (error) {
            console.error('Error making move:', error);
        }
    }

    isPieceOfCurrentPlayer(piece) {
        const isWhitePiece = piece === '♚' || piece === '♛' || piece === '♜' || 
                            piece === '♝' || piece === '♞' || piece === '♟';
        return (isWhitePiece && this.gameState.turn === 'white') ||
               (!isWhitePiece && this.gameState.turn === 'black');
    }

    updateGameState(data) {
        this.gameState = {
            ...this.gameState,
            ...data.board,
            moveHistory: data.move_history || this.gameState.moveHistory
        };
        
        this.updateBoard();
        this.updateMoveHistory();
        this.updateStatusDisplay();
    }

    updateMoveHistory() {
        const historyContainer = document.getElementById('moveHistory');
        
        if (this.gameState.moveHistory.length === 0) {
            historyContainer.innerHTML = '<div class="history-placeholder">No moves yet</div>';
            return;
        }
        
        historyContainer.innerHTML = '';
        
        for (let i = 0; i < this.gameState.moveHistory.length; i += 2) {
            const moveEntry = document.createElement('div');
            moveEntry.className = 'move-entry';
            
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = this.gameState.moveHistory[i];
            const blackMove = this.gameState.moveHistory[i + 1];
            
            moveEntry.innerHTML = `
                <span class="move-number">${moveNumber}.</span>
                <span class="move-text">${whiteMove}${blackMove ? ' ' + blackMove : ''}</span>
            `;
            
            historyContainer.appendChild(moveEntry);
        }
        
        historyContainer.scrollTop = historyContainer.scrollHeight;
    }

    updateStatusDisplay() {
        const statusDisplay = document.getElementById('statusDisplay');
        const gameResult = document.getElementById('gameResult');
        
        let statusText = `${this.gameState.turn.charAt(0).toUpperCase() + this.gameState.turn.slice(1)} to move`;
        let resultText = '';
        
        if (this.gameState.isCheckmate) {
            statusText = 'Checkmate!';
            resultText = `${this.gameState.turn === 'white' ? 'Black' : 'White'} wins!`;
        } else if (this.gameState.isStalemate) {
            statusText = 'Stalemate!';
            resultText = 'Game is a draw';
        } else if (this.gameState.isDraw) {
            statusText = 'Draw!';
            resultText = 'Game is a draw';
        } else if (this.gameState.isCheck) {
            statusText = 'Check!';
        }
        
        statusDisplay.textContent = statusText;
        gameResult.textContent = resultText;
    }

    setupEventListeners() {
        // New Game Button
        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        // Engine Move Button
        document.getElementById('engineMoveBtn').addEventListener('click', () => {
            this.requestEngineMove();
        });
        
        // Undo Button
        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undoMove();
        });
        
        // Difficulty Slider
        const difficultySlider = document.getElementById('difficultySlider');
        const difficultyValue = document.getElementById('difficultyValue');
        
        difficultySlider.addEventListener('input', (e) => {
            this.difficulty = parseInt(e.target.value);
            difficultyValue.textContent = this.difficulty;
        });
    }

    async startNewGame() {
        try {
            const response = await fetch('/api/new-game');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.updateGameState(data);
                this.clearSelection();
            }
        } catch (error) {
            console.error('Error starting new game:', error);
        }
    }

    async requestEngineMove() {
        try {
            const response = await fetch('/api/engine-move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ difficulty: this.difficulty })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.updateGameState(data);
            } else {
                console.error('Engine move failed:', data.error);
            }
        } catch (error) {
            console.error('Error requesting engine move:', error);
        }
    }

    async undoMove() {
        try {
            const response = await fetch('/api/undo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.updateGameState(data);
                this.clearSelection();
            } else {
                console.error('Undo failed:', data.error);
            }
        } catch (error) {
            console.error('Error undoing move:', error);
        }
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CozyChess();
}); 