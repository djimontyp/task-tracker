import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { logger } from '@/shared/utils/logger'

// Ping timeout - if no ping received within this time, connection is considered dead
const PING_TIMEOUT = 45_000

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
  const envHost = import.meta.env.VITE_WS_HOST?.trim()
  if (envHost) {
    return envHost
  }

  if (typeof window !== 'undefined') {
    return window.location.hostname
  }

  return 'localhost'
}

const resolveWebSocketUrl = (topics?: string[]) => {
  const scheme = resolveScheme()
  const host = resolveHost()
  const path = normalizePath(import.meta.env.VITE_WS_PATH)

  // Don't add port for standard HTTP/HTTPS ports (80/443)
  // ngrok and production proxies don't include port in URL
  const locationPort = typeof window !== 'undefined' ? window.location.port : ''
  const shouldAddPort = locationPort && locationPort !== '80' && locationPort !== '443'
  const port = shouldAddPort ? `:${locationPort}` : ''

  let url = `${scheme}://${host}${port}${path}`

  if (topics && topics.length > 0) {
    url += `?topics=${topics.join(',')}`
  }

  return url
}

export type WebSocketState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export interface UseWebSocketOptions {
  topics?: string[]
  onMessage?: (data: unknown) => void
  onConnect?: () => void
  onDisconnect?: () => void
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    topics,
    onMessage,
    onConnect,
    onDisconnect,
    reconnect = true,
    reconnectInterval = 1000,
    maxReconnectAttempts = 5,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<WebSocketState>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const isMountedRef = useRef(true)
  const isConnectingRef = useRef(false)
  const reconnectAttemptsRef = useRef(0)

  // Reliability: connection ID, ping tracking, sequence numbers
  const connectionIdRef = useRef<string | null>(null)
  const lastPingTimeRef = useRef<number>(Date.now())
  const pingTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSeqRef = useRef<Record<string, number>>({}) // topic -> last seq for replay on reconnect

  // Reset ping timeout - called on each ping or connection event
  const resetPingTimeout = () => {
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current)
    }
    lastPingTimeRef.current = Date.now()
    pingTimeoutRef.current = setTimeout(() => {
      logger.warn('No ping received for 45s, connection may be dead')
      if (wsRef.current) {
        wsRef.current.close(4000, 'Ping timeout')
      }
    }, PING_TIMEOUT)
  }

  const connect = () => {
    if (isConnectingRef.current) {
      logger.debug('⚠️  Connection already in progress, skipping...')
      return
    }

    if (wsRef.current) {
      const currentState = wsRef.current.readyState
      if (currentState === WebSocket.CONNECTING || currentState === WebSocket.OPEN) {
        logger.debug(`⚠️  WebSocket already ${currentState === WebSocket.CONNECTING ? 'connecting' : 'open'}, skipping...`)
        return
      }
    }

    try {
      isConnectingRef.current = true
      setConnectionState('connecting')

      // Build URL with topics
      let wsUrl = resolveWebSocketUrl(topics)

      // Add lastSeq for message replay on reconnect (only if we have tracked sequences)
      const seqParams = Object.entries(lastSeqRef.current)
        .filter(([, seq]) => seq > 0)
        .map(([topic, seq]) => `${topic}:${seq}`)
        .join(',')

      if (seqParams) {
        wsUrl += (wsUrl.includes('?') ? '&' : '?') + `lastSeq=${seqParams}`
      }

      logger.debug('Connecting to WebSocket:', wsUrl, 'with topics:', topics)
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        logger.debug('WebSocket opened successfully')
        isConnectingRef.current = false
        reconnectAttemptsRef.current = 0

        if (!isMountedRef.current) {
          logger.debug('Component unmounted, closing connection')
          ws.close()
          return
        }

        // Start ping timeout tracking
        resetPingTimeout()

        setIsConnected(true)
        setConnectionState('connected')
        onConnect?.()

        if (reconnectAttemptsRef.current > 0) {
          toast.success('З\'єднання відновлено')
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Handle ping - respond immediately with pong
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', ts: data.ts }))
            resetPingTimeout()
            return // Don't pass ping to onMessage callback
          }

          // Handle connection confirmation - store connectionId
          if (data.type === 'connection' && data.data?.connectionId) {
            connectionIdRef.current = data.data.connectionId
            resetPingTimeout()
            logger.debug(`Connection ID: ${data.data.connectionId}`)
          }

          // Track sequence numbers for replay on reconnect
          if (data.seq !== undefined && data.topic) {
            lastSeqRef.current[data.topic] = data.seq
          }

          logger.debug('WebSocket message received:', data)
          if (data.type) {
            logger.debug(`Message type: ${data.type}`)
          }

          onMessage?.(data)
        } catch (error) {
          logger.error('WebSocket message parse error:', error)
        }
      }

      ws.onerror = (error) => {
        const readyState = ws.readyState
        const stateText = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][readyState]
        logger.error(`❌ WebSocket error in state ${readyState} (${stateText}):`, error)

        isConnectingRef.current = false

        if (connectionState === 'connecting') {
          logger.debug('⚠️  Error during initial connection, will retry...')
        }
      }

      ws.onclose = (event) => {
        logger.debug('WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        })
        isConnectingRef.current = false

        // Clear ping timeout on close
        if (pingTimeoutRef.current) {
          clearTimeout(pingTimeoutRef.current)
        }

        if (!isMountedRef.current) {
          logger.debug('Component unmounted, skipping reconnect')
          return
        }

        setIsConnected(false)
        setConnectionState(reconnect ? 'reconnecting' : 'disconnected')
        onDisconnect?.()

        if (reconnect && isMountedRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1
          const delay = Math.min(reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1), 30000)
          logger.debug(`⏳ Reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms...`)

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              logger.debug('🔄 Attempting to reconnect...')
              connect()
            } else {
              logger.debug('⚠️  Component unmounted during reconnect delay, skipping')
            }
          }, delay)
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          logger.error('❌ Max reconnection attempts reached')
          setConnectionState('disconnected')
          toast.error('Не вдалося підключитися. Перезавантажте сторінку.')
        }
      }

      wsRef.current = ws
    } catch (error) {
      logger.error('❌ Failed to create WebSocket:', error)
      isConnectingRef.current = false

      if (reconnect && isMountedRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current += 1
        const delay = Math.min(reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1), 30000)
        logger.debug(`⏳ Retry attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms...`)
        setConnectionState('reconnecting')

        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connect()
          }
        }, delay)
      } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        logger.error('❌ Max connection attempts reached')
        setConnectionState('disconnected')
        toast.error('Не вдалося підключитися до сервера')
      }
    }
  }

  const disconnect = () => {
    logger.debug('Disconnecting WebSocket...')

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = undefined
    }

    // Clear ping timeout
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current)
      pingTimeoutRef.current = undefined
    }

    // Close WebSocket connection safely
    if (wsRef.current) {
      const ws = wsRef.current
      const currentState = ws.readyState

      logger.debug(`📊 WebSocket state before close: ${currentState} (${
        ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][currentState]
      })`)

      // Only close if not already closing or closed
      if (currentState === WebSocket.CONNECTING || currentState === WebSocket.OPEN) {
        try {
          ws.close(1000, 'Component unmounting')
          logger.debug('✅ WebSocket close() called')
        } catch (error) {
          logger.error('❌ Error closing WebSocket:', error)
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
      logger.warn('WebSocket is not connected')
    }
  }

  useEffect(() => {
    logger.debug('useWebSocket mounted')
    isMountedRef.current = true

    connect()

    return () => {
      logger.debug('useWebSocket unmounting')
      isMountedRef.current = false
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current)
      }
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
    connectionId: connectionIdRef.current,
  }
}
