import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import { logger } from '@/shared/utils/logger'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const PING_TIMEOUT = 45_000
const DEFAULT_WS_PATH = '/ws'
const MAX_RECONNECT_ATTEMPTS = 5
const BASE_RECONNECT_INTERVAL = 1000
const MAX_RECONNECT_DELAY = 30_000

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export type WebSocketState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export type MessageCallback = (data: unknown) => void

interface Subscription {
  topics: string[]
  callback: MessageCallback
}

interface WebSocketContextValue {
  connectionState: WebSocketState
  isConnected: boolean
  connectionId: string | null
  subscribe: (topics: string[], callback: MessageCallback) => string
  unsubscribe: (subscriptionId: string) => void
  send: (data: unknown) => void
}

// -----------------------------------------------------------------------------
// URL Resolution
// -----------------------------------------------------------------------------
const normalizePath = (value?: string | null): string => {
  if (!value) return DEFAULT_WS_PATH
  const trimmed = value.trim()
  if (!trimmed) return DEFAULT_WS_PATH
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

const resolveScheme = (): 'ws' | 'wss' => {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return 'wss'
  }
  return 'ws'
}

const resolveHost = (): string => {
  const envHost = import.meta.env.VITE_WS_HOST?.trim()
  if (envHost) {
    return envHost
  }
  if (typeof window !== 'undefined') {
    return window.location.hostname
  }
  return 'localhost'
}

const buildWebSocketUrl = (topics: string[]): string => {
  const scheme = resolveScheme()
  const host = resolveHost()
  const path = normalizePath(import.meta.env.VITE_WS_PATH)

  // Don't add port for standard HTTP/HTTPS ports (80/443)
  const locationPort = typeof window !== 'undefined' ? window.location.port : ''
  const shouldAddPort = locationPort && locationPort !== '80' && locationPort !== '443'
  const port = shouldAddPort ? `:${locationPort}` : ''

  let url = `${scheme}://${host}${port}${path}`

  if (topics.length > 0) {
    const uniqueTopics = [...new Set(topics)]
    url += `?topics=${uniqueTopics.join(',')}`
  }

  return url
}

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------
const WebSocketContext = createContext<WebSocketContextValue | null>(null)

// -----------------------------------------------------------------------------
// Provider Component
// -----------------------------------------------------------------------------
interface WebSocketProviderProps {
  children: ReactNode
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [connectionState, setConnectionState] = useState<WebSocketState>('disconnected')
  const [connectionId, setConnectionId] = useState<string | null>(null)

  // Refs for singleton management
  const wsRef = useRef<WebSocket | null>(null)
  const subscriptionsRef = useRef<Map<string, Subscription>>(new Map())
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const pingTimeoutRef = useRef<NodeJS.Timeout>()
  const topicsDebounceRef = useRef<NodeJS.Timeout>()
  const isMountedRef = useRef(true)
  const isConnectingRef = useRef(false)
  const lastSeqRef = useRef<Record<string, number>>({})
  const currentTopicsRef = useRef<string>('')

  // Compute all active topics from subscriptions
  const getActiveTopics = useCallback((): string[] => {
    const topicsSet = new Set<string>()
    subscriptionsRef.current.forEach((sub) => {
      sub.topics.forEach((topic) => topicsSet.add(topic))
    })
    return Array.from(topicsSet)
  }, [])

  // Reset ping timeout
  const resetPingTimeout = useCallback(() => {
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current)
    }
    pingTimeoutRef.current = setTimeout(() => {
      logger.warn('[WS Provider] No ping received for 45s, connection may be dead')
      if (wsRef.current) {
        wsRef.current.close(4000, 'Ping timeout')
      }
    }, PING_TIMEOUT)
  }, [])

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = undefined
    }
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current)
      pingTimeoutRef.current = undefined
    }
    if (topicsDebounceRef.current) {
      clearTimeout(topicsDebounceRef.current)
      topicsDebounceRef.current = undefined
    }
  }, [])

  // Dispatch message to all matching subscriptions
  const dispatchMessage = useCallback((data: unknown) => {
    const message = data as { topic?: string }
    subscriptionsRef.current.forEach((sub) => {
      // If message has a topic, only dispatch to matching subscriptions
      // If no topic in message, dispatch to all subscriptions
      if (!message.topic || sub.topics.includes(message.topic)) {
        try {
          sub.callback(data)
        } catch (error) {
          logger.error('[WS Provider] Error in subscription callback:', error)
        }
      }
    })
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (isConnectingRef.current) {
      logger.debug('[WS Provider] Connection already in progress, skipping...')
      return
    }

    if (wsRef.current) {
      const currentState = wsRef.current.readyState
      if (currentState === WebSocket.CONNECTING || currentState === WebSocket.OPEN) {
        logger.debug(`[WS Provider] WebSocket already ${currentState === WebSocket.CONNECTING ? 'connecting' : 'open'}, skipping...`)
        return
      }
    }

    const topics = getActiveTopics()
    if (topics.length === 0) {
      logger.debug('[WS Provider] No active topics, skipping connection')
      return
    }

    try {
      isConnectingRef.current = true
      setConnectionState('connecting')

      let wsUrl = buildWebSocketUrl(topics)

      // Add lastSeq for message replay on reconnect
      const seqParams = Object.entries(lastSeqRef.current)
        .filter(([, seq]) => seq > 0)
        .map(([topic, seq]) => `${topic}:${seq}`)
        .join(',')

      if (seqParams) {
        wsUrl += (wsUrl.includes('?') ? '&' : '?') + `lastSeq=${seqParams}`
      }

      logger.debug('[WS Provider] Connecting to:', wsUrl)
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        logger.debug('[WS Provider] Connected successfully')
        isConnectingRef.current = false
        reconnectAttemptsRef.current = 0

        if (!isMountedRef.current) {
          logger.debug('[WS Provider] Provider unmounted, closing connection')
          ws.close()
          return
        }

        resetPingTimeout()
        setConnectionState('connected')

        if (reconnectAttemptsRef.current > 0) {
          toast.success("З'єднання відновлено")
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Handle ping
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', ts: data.ts }))
            resetPingTimeout()
            return
          }

          // Handle connection confirmation
          if (data.type === 'connection' && data.data?.connectionId) {
            setConnectionId(data.data.connectionId)
            resetPingTimeout()
            logger.debug(`[WS Provider] Connection ID: ${data.data.connectionId}`)
          }

          // Track sequence numbers
          if (data.seq !== undefined && data.topic) {
            lastSeqRef.current[data.topic] = data.seq
          }

          logger.debug('[WS Provider] Message received:', data.type || 'unknown', data.topic || '')
          dispatchMessage(data)
        } catch (error) {
          logger.error('[WS Provider] Message parse error:', error)
        }
      }

      ws.onerror = (error) => {
        const readyState = ws.readyState
        const stateText = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][readyState]
        logger.error(`[WS Provider] Error in state ${readyState} (${stateText}):`, error)
        isConnectingRef.current = false
      }

      ws.onclose = (event) => {
        logger.debug('[WS Provider] Connection closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        })
        isConnectingRef.current = false
        clearTimers()

        if (!isMountedRef.current) {
          logger.debug('[WS Provider] Provider unmounted, skipping reconnect')
          return
        }

        setConnectionState('reconnecting')

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1
          const delay = Math.min(
            BASE_RECONNECT_INTERVAL * Math.pow(2, reconnectAttemptsRef.current - 1),
            MAX_RECONNECT_DELAY
          )
          logger.debug(
            `[WS Provider] Reconnect attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms...`
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect()
            }
          }, delay)
        } else {
          logger.error('[WS Provider] Max reconnection attempts reached')
          setConnectionState('disconnected')
          toast.error('Не вдалося підключитися. Перезавантажте сторінку.')
        }
      }

      wsRef.current = ws
    } catch (error) {
      logger.error('[WS Provider] Failed to create WebSocket:', error)
      isConnectingRef.current = false
      setConnectionState('disconnected')
    }
  }, [getActiveTopics, resetPingTimeout, clearTimers, dispatchMessage])

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    logger.debug('[WS Provider] Disconnecting...')
    clearTimers()

    if (wsRef.current) {
      const ws = wsRef.current
      const currentState = ws.readyState

      if (currentState === WebSocket.CONNECTING || currentState === WebSocket.OPEN) {
        try {
          ws.close(1000, 'Provider cleanup')
        } catch (error) {
          logger.error('[WS Provider] Error closing WebSocket:', error)
        }
      }

      ws.onopen = null
      ws.onmessage = null
      ws.onerror = null
      ws.onclose = null
      wsRef.current = null
    }

    isConnectingRef.current = false
    setConnectionState('disconnected')
  }, [clearTimers])

  // Refs for functions to break circular dependencies
  const connectRef = useRef(connect)
  const disconnectRef = useRef(disconnect)
  const getActiveTopicsRef = useRef(getActiveTopics)

  // Keep refs updated (synchronous, no effect trigger)
  connectRef.current = connect
  disconnectRef.current = disconnect
  getActiveTopicsRef.current = getActiveTopics

  // Stable schedule function using refs - avoids dependency cycles entirely
  const scheduleTopicsUpdate = useCallback(() => {
    // Clear existing debounce timer
    if (topicsDebounceRef.current) {
      clearTimeout(topicsDebounceRef.current)
    }

    // Debounce topic updates - wait 50ms for all subscriptions to settle
    topicsDebounceRef.current = setTimeout(() => {
      if (!isMountedRef.current) return

      const topics = getActiveTopicsRef.current()
      const topicsKey = topics.sort().join(',')

      // Check if topics actually changed
      if (topicsKey === currentTopicsRef.current) {
        logger.debug('[WS Provider] Topics unchanged, skipping reconnect')
        return
      }

      logger.debug('[WS Provider] Topics changed:', currentTopicsRef.current, '->', topicsKey)
      currentTopicsRef.current = topicsKey

      if (topics.length === 0) {
        // No subscriptions, disconnect
        disconnectRef.current()
        return
      }

      // If connected, reconnect to update topics in URL
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        logger.debug('[WS Provider] Reconnecting to update topics:', topics)
        disconnectRef.current()
        // Small delay before reconnecting
        setTimeout(() => {
          if (isMountedRef.current) {
            connectRef.current()
          }
        }, 50)
      } else if (!isConnectingRef.current) {
        // Not connected, just connect
        connectRef.current()
      }
    }, 50)
  }, []) // Empty deps - uses refs for all dependencies

  // Subscribe to topics
  const subscribe = useCallback(
    (topics: string[], callback: MessageCallback): string => {
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`

      logger.debug('[WS Provider] Subscribe:', subscriptionId, 'topics:', topics)

      subscriptionsRef.current.set(subscriptionId, { topics, callback })

      // Schedule debounced reconnect to include new topics
      scheduleTopicsUpdate()

      return subscriptionId
    },
    [scheduleTopicsUpdate]
  )

  // Unsubscribe
  const unsubscribe = useCallback(
    (subscriptionId: string) => {
      logger.debug('[WS Provider] Unsubscribe:', subscriptionId)

      subscriptionsRef.current.delete(subscriptionId)

      // Schedule debounced check for topic changes
      scheduleTopicsUpdate()
    },
    [scheduleTopicsUpdate]
  )

  // Send message
  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      logger.warn('[WS Provider] WebSocket is not connected')
    }
  }, [])

  // Lifecycle
  useEffect(() => {
    isMountedRef.current = true
    logger.debug('[WS Provider] Mounted')

    return () => {
      logger.debug('[WS Provider] Unmounting')
      isMountedRef.current = false
      disconnect()
    }
  }, [disconnect])

  // Memoize context value to prevent unnecessary re-renders of consumers
  // Only changes when connection state, connectionId, or function refs change
  const value = useMemo<WebSocketContextValue>(
    () => ({
      connectionState,
      isConnected: connectionState === 'connected',
      connectionId,
      subscribe,
      unsubscribe,
      send,
    }),
    [connectionState, connectionId, subscribe, unsubscribe, send]
  )

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

// -----------------------------------------------------------------------------
// Hook for accessing WebSocket context
// -----------------------------------------------------------------------------
export const useWebSocketContext = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
}
