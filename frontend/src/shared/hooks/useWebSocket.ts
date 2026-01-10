import { useEffect, useRef } from 'react'
import { useWebSocketContext, type WebSocketState } from '@/shared/providers/WebSocketProvider'

export type { WebSocketState }

export interface UseWebSocketOptions {
  topics?: string[]
  onMessage?: (data: unknown) => void
  onConnect?: () => void
  onDisconnect?: () => void
  _reconnect?: boolean
  _reconnectInterval?: number
  _maxReconnectAttempts?: number
}

/**
 * Hook for subscribing to WebSocket topics.
 *
 * Uses the singleton WebSocketProvider under the hood - all components
 * share a single WebSocket connection with dynamic topic subscriptions.
 *
 * IMPORTANT: Callbacks (onMessage, onConnect, onDisconnect) are stored in refs
 * to avoid infinite loops when callers pass inline functions. This means callback
 * changes won't trigger re-subscriptions - they'll just be used on next invocation.
 *
 * IMPORTANT: Topics array is serialized to a string key to prevent infinite loops
 * when callers pass inline arrays like `topics: ['analysis', 'proposals']`.
 * The string comparison ensures stable dependencies even with new array references.
 */
export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { topics = [], onMessage, onConnect, onDisconnect } = options

  const {
    connectionState,
    isConnected,
    connectionId,
    subscribe,
    unsubscribe,
    send,
  } = useWebSocketContext()

  const subscriptionIdRef = useRef<string | null>(null)
  const prevConnectedRef = useRef<boolean>(false)

  // Store callbacks in refs to avoid re-subscription on every render
  // when callers pass inline functions (common pattern)
  const onMessageRef = useRef(onMessage)
  const onConnectRef = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)

  // Keep refs up-to-date (synchronous, no effect trigger)
  onMessageRef.current = onMessage
  onConnectRef.current = onConnect
  onDisconnectRef.current = onDisconnect

  // Stable key for topics array - computed directly without useMemo
  // This creates a string that React can compare by value in useEffect deps
  // Even if topics is a new array reference, the string will be the same
  const topicsKey = topics.join(',')

  // Stable message handler - uses ref so callback changes don't trigger re-subscription
  const handleMessageRef = useRef((data: unknown) => {
    onMessageRef.current?.(data)
  })

  // Subscribe to topics
  // Note: subscribe/unsubscribe are stable (empty deps in useCallback) so we don't include them
  // to avoid triggering re-subscriptions when provider re-renders
  useEffect(() => {
    if (topics.length === 0) {
      return
    }

    subscriptionIdRef.current = subscribe(topics, handleMessageRef.current)

    return () => {
      if (subscriptionIdRef.current) {
        unsubscribe(subscriptionIdRef.current)
        subscriptionIdRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicsKey])

  // Call onConnect/onDisconnect callbacks on state changes
  // Uses refs to avoid infinite loops from inline callbacks
  useEffect(() => {
    if (isConnected && !prevConnectedRef.current) {
      onConnectRef.current?.()
    } else if (!isConnected && prevConnectedRef.current) {
      onDisconnectRef.current?.()
    }
    prevConnectedRef.current = isConnected
  }, [isConnected])

  return {
    isConnected,
    send,
    disconnect: () => {
      if (subscriptionIdRef.current) {
        unsubscribe(subscriptionIdRef.current)
        subscriptionIdRef.current = null
      }
    },
    reconnect: () => {
      // Unsubscribe and resubscribe to trigger reconnection
      if (subscriptionIdRef.current) {
        unsubscribe(subscriptionIdRef.current)
      }
      if (topics.length > 0) {
        subscriptionIdRef.current = subscribe(topics, handleMessageRef.current)
      }
    },
    connectionState,
    connectionId,
  }
}
