import { useState, useEffect, useCallback, useRef } from 'react'

export function useChessGame(socket) {
  const [gameState, setGameState] = useState({
    board: null,
    game_status: 'ongoing',
    move_history: [],
    last_move: null
  })
  
  const [difficulty, setDifficulty] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef(null)

  // Debounced API calls
  const debounceRef = useRef(null)
  const debouncedCall = useCallback((fn, delay = 300) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fn, delay)
  }, [])

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    const handleConnected = (data) => {
      setGameState(prev => ({ ...prev, ...data.board }))
    }

    const handleMoveMade = (data) => {
      setGameState(prev => ({
        ...prev,
        board: data.board,
        game_status: data.game_status,
        last_move: data.move
      }))
    }

    const handleEngineMove = (data) => {
      setGameState(prev => ({
        ...prev,
        board: data.board,
        game_status: data.game_status,
        last_move: data.move
      }))
    }

    const handleMoveUndone = (data) => {
      setGameState(prev => ({
        ...prev,
        board: data.board,
        game_status: data.game_status
      }))
    }

    socket.on('connected', handleConnected)
    socket.on('move_made', handleMoveMade)
    socket.on('engine_move', handleEngineMove)
    socket.on('move_undone', handleMoveUndone)

    return () => {
      socket.off('connected', handleConnected)
      socket.off('move_made', handleMoveMade)
      socket.off('engine_move', handleEngineMove)
      socket.off('move_undone', handleMoveUndone)
    }
  }, [socket])

  // API functions with error handling and caching
  const makeMove = useCallback(async (move) => {
    if (!socket?.connected) return

    try {
      setIsLoading(true)
      
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Move failed')
      }

      const data = await response.json()
      setGameState(prev => ({
        ...prev,
        board: data.board,
        game_status: data.game_status,
        last_move: data.move
      }))

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Move error:', error)
        // You could add toast notifications here
      }
    } finally {
      setIsLoading(false)
    }
  }, [socket])

  const requestEngineMove = useCallback(async () => {
    if (!socket?.connected) return

    try {
      setIsLoading(true)
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/engine-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Engine move failed')
      }

      const data = await response.json()
      setGameState(prev => ({
        ...prev,
        board: data.board,
        game_status: data.game_status,
        last_move: data.move
      }))

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Engine move error:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [socket, difficulty])

  const startNewGame = useCallback(async () => {
    if (!socket?.connected) return

    try {
      setIsLoading(true)
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/new-game', {
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to start new game')
      }

      const data = await response.json()
      setGameState({
        board: data.board,
        game_status: 'ongoing',
        move_history: [],
        last_move: null
      })

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('New game error:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [socket])

  const undoMove = useCallback(async () => {
    if (!socket?.connected) return

    try {
      setIsLoading(true)
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/undo', {
        method: 'POST',
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Undo failed')
      }

      const data = await response.json()
      setGameState(prev => ({
        ...prev,
        board: data.board,
        game_status: data.game_status
      }))

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Undo error:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [socket])

  const updateDifficulty = useCallback((newDifficulty) => {
    setDifficulty(newDifficulty)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    gameState,
    makeMove,
    requestEngineMove,
    startNewGame,
    undoMove,
    updateDifficulty,
    isLoading,
    difficulty
  }
} 