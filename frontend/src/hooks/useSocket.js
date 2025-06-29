import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

export function useSocket(url) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const socketRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 1000 // Start with 1 second

  const connect = useCallback(() => {
    if (socketRef.current?.connected || isConnecting) return

    setIsConnecting(true)
    
    try {
      socketRef.current = io(url, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: false, // We'll handle reconnection manually
        autoConnect: true
      })

      socketRef.current.on('connect', () => {
        setIsConnected(true)
        setIsConnecting(false)
        reconnectAttemptsRef.current = 0
        console.log('Connected to chess server')
      })

      socketRef.current.on('disconnect', (reason) => {
        setIsConnected(false)
        setIsConnecting(false)
        console.log('Disconnected from chess server:', reason)
        
        // Attempt to reconnect if not manually disconnected
        if (reason !== 'io client disconnect' && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        }
      })

      socketRef.current.on('connect_error', (error) => {
        setIsConnecting(false)
        console.error('Connection error:', error)
        
        // Retry connection on error
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        }
      })

    } catch (error) {
      setIsConnecting(false)
      console.error('Failed to create socket connection:', error)
    }
  }, [url, isConnecting])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    
    setIsConnected(false)
    setIsConnecting(false)
    reconnectAttemptsRef.current = 0
  }, [])

  // Connect on mount
  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    connect,
    disconnect
  }
} 