import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

const DEFAULT_WS_PATH = '/ws'

const normalizePath = (value?: string | null) => {
  if (!value) return DEFAULT_WS_PATH
  const trimmed = value.trim()
  if (!trimmed) return DEFAULT_WS_PATH
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

const resolveScheme = () => {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return 'wss'
  }
  return 'ws'
}

const resolveHost = () => {
  const envHost = process.env.REACT_APP_WS_HOST?.trim()
  if (envHost) {
    return envHost
  }

  if (typeof window !== 'undefined') {
    return window.location.hostname
  }

  return 'localhost'
}

const resolveWebSocketUrl = () => {
  const scheme = resolveScheme()
  const host = resolveHost()
  const path = normalizePath(process.env.REACT_APP_WS_PATH)

  // Use window.location.port if available for correct port resolution
  const port = typeof window !== 'undefined' && window.location.port
    ? `:${window.location.port}`
    : ''

  return `${scheme}://${host}${port}${path}`
}

type WebSocketState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

interface UseWebSocketOptions {
  onMessage?: (data: unknown) => void
  onConnect?: () => void
  onDisconnect?: () => void
  reconnect?: boolean
  reconnectInterval?: number
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    reconnect = true,
    reconnectInterval = 3000,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<WebSocketState>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const isMountedRef = useRef(true)
  const isConnectingRef = useRef(false)

  const connect = () => {
    // Guard: prevent multiple simultaneous connections
    if (isConnectingRef.current) {
      console.log('⚠️  Connection already in progress, skipping...')
      return
    }

    // Guard: check if there's already an active connection
    if (wsRef.current) {
      const currentState = wsRef.current.readyState
      if (currentState === WebSocket.CONNECTING || currentState === WebSocket.OPEN) {
        console.log(`⚠️  WebSocket already ${currentState === WebSocket.CONNECTING ? 'connecting' : 'open'}, skipping...`)
        return
      }
    }

    try {
      isConnectingRef.current = true
      setConnectionState('connecting')
      // Resolve WebSocket URL at runtime, not at module load time
      const wsUrl = process.env.REACT_APP_WS_URL || resolveWebSocketUrl()
      console.log('🔌 Connecting to WebSocket:', wsUrl)
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('✅ WebSocket opened successfully')
        isConnectingRef.current = false

        if (!isMountedRef.current) {
          console.log('⚠️  Component unmounted, closing connection')
          ws.close()
          return
        }

        setIsConnected(true)
        setConnectionState('connected')
        onConnect?.()
        toast.success('З\'єднання встановлено')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 WebSocket message:', data)
          onMessage?.(data)
        } catch (error) {
          console.error('WebSocket message parse error:', error)
        }
      }

      ws.onerror = (error) => {
        const readyState = ws.readyState
        const stateText = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][readyState]
        console.error(`❌ WebSocket error in state ${readyState} (${stateText}):`, error)

        isConnectingRef.current = false

        // Only show toast for initial connection errors, not during reconnect
        if (connectionState === 'connecting') {
          console.log('⚠️  Error during initial connection, will retry...')
        }
      }

      ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        })
        isConnectingRef.current = false

        if (!isMountedRef.current) {
          console.log('⚠️  Component unmounted, skipping reconnect')
          return
        }

        setIsConnected(false)
        setConnectionState(reconnect ? 'reconnecting' : 'disconnected')
        onDisconnect?.()

        if (reconnect && isMountedRef.current) {
          console.log(`⏳ Will reconnect in ${reconnectInterval}ms...`)
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              console.log('🔄 Attempting to reconnect...')
              connect()
            } else {
              console.log('⚠️  Component unmounted during reconnect delay, skipping')
            }
          }, reconnectInterval)
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error)
      isConnectingRef.current = false

      // Only show toast for initial connection failures
      if (connectionState === 'connecting') {
        toast.error('Не вдалося підключитися до сервера')
      }

      // Try to reconnect if enabled and component is mounted
      if (reconnect && isMountedRef.current) {
        console.log(`⏳ Will retry connection in ${reconnectInterval}ms...`)
        setConnectionState('reconnecting')
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connect()
          }
        }, reconnectInterval)
      }
    }
  }

  const disconnect = () => {
    console.log('🔌 Disconnecting WebSocket...')

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = undefined
    }

    // Close WebSocket connection safely
    if (wsRef.current) {
      const ws = wsRef.current
      const currentState = ws.readyState

      console.log(`📊 WebSocket state before close: ${currentState} (${
        ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][currentState]
      })`)

      // Only close if not already closing or closed
      if (currentState === WebSocket.CONNECTING || currentState === WebSocket.OPEN) {
        try {
          ws.close(1000, 'Component unmounting')
          console.log('✅ WebSocket close() called')
        } catch (error) {
          console.error('❌ Error closing WebSocket:', error)
        }
      }

      // Remove event listeners to prevent memory leaks
      ws.onopen = null
      ws.onmessage = null
      ws.onerror = null
      ws.onclose = null

      wsRef.current = null
    }

    isConnectingRef.current = false
    setIsConnected(false)
    setConnectionState('disconnected')
  }

  const send = (data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  useEffect(() => {
    console.log('🎯 useWebSocket mounted')
    isMountedRef.current = true

    connect()

    return () => {
      console.log('🎯 useWebSocket unmounting')
      isMountedRef.current = false
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    isConnected,
    send,
    disconnect,
    reconnect: connect,
    connectionState,
  }
}
