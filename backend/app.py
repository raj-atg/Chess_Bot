from flask import Flask, request, jsonify
import chess
import random

app = Flask(__name__)

# Global game state
game_state = {
    'board': chess.Board(),
    'move_history': [],  # Store SAN notation
    'game_status': 'ongoing',
    'last_move': None,
    'engine_difficulty': 5
}

def get_random_move(board, difficulty=5):
    legal_moves = list(board.legal_moves)
    if not legal_moves:
        return None
    captures = [move for move in legal_moves if board.is_capture(move)]
    if difficulty >= 5 and captures:
        return random.choice(captures)
    return random.choice(legal_moves)

@app.route('/api/new-game', methods=['GET'])
def new_game():
    global game_state
    game_state = {
        'board': chess.Board(),
        'move_history': [],
        'game_status': 'ongoing',
        'last_move': None,
        'engine_difficulty': 5
    }
    return jsonify({
        'status': 'success',
        'message': 'New game started',
        'board': get_board_state()
    })

@app.route('/api/board', methods=['GET'])
def get_board():
    return jsonify(get_board_state())

@app.route('/api/move', methods=['POST'])
def make_move():
    global game_state
    data = request.get_json()
    move_san = data.get('move')
    if not move_san:
        return jsonify({'error': 'No move provided'}), 400
    try:
        board = game_state['board']
        # Accept both UCI and SAN
        if len(move_san) == 4:
            move = chess.Move.from_uci(move_san)
        else:
            move = board.parse_san(move_san)
        if move not in board.legal_moves:
            return jsonify({'error': 'Illegal move'}), 400
        san = board.san(move)
        board.push(move)
        game_state['last_move'] = san
        game_state['move_history'].append(san)
        update_game_status()
        return jsonify({
            'status': 'success',
            'move': san,
            'board': get_board_state(),
            'game_status': game_state['game_status']
        })
    except Exception as e:
        return jsonify({'error': f'Invalid move: {str(e)}'}), 400

@app.route('/api/game-status', methods=['GET'])
def game_status():
    return jsonify({
        'status': game_state['game_status'],
        'move_history': game_state['move_history'],
        'last_move': game_state['last_move']
    })

@app.route('/api/takeback', methods=['POST'])
def takeback():
    global game_state
    board = game_state['board']
    if len(board.move_stack) > 0:
        board.pop()
        if game_state['move_history']:
            game_state['move_history'].pop()
        update_game_status()
        game_state['last_move'] = game_state['move_history'][-1] if game_state['move_history'] else None
        return jsonify({
            'status': 'success',
            'board': get_board_state(),
            'move_history': game_state['move_history'],
            'game_status': game_state['game_status']
        })
    else:
        return jsonify({'error': 'No moves to take back'}), 400

def get_board_state():
    board = game_state['board']
    return {
        'fen': board.fen(),
        'is_check': board.is_check(),
        'is_checkmate': board.is_checkmate(),
        'is_stalemate': board.is_stalemate(),
        'legal_moves': [move.uci() for move in board.legal_moves],
        'turn': 'white' if board.turn else 'black'
    }

def update_game_status():
    board = game_state['board']
    if board.is_checkmate():
        game_state['game_status'] = 'checkmate'
    elif board.is_stalemate():
        game_state['game_status'] = 'stalemate'
    elif board.is_check():
        game_state['game_status'] = 'check'
    else:
        game_state['game_status'] = 'ongoing'

if __name__ == '__main__':
    print("Full Stack Chess App Backend Running...")
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True) 