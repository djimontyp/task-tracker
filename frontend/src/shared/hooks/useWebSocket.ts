import { useEffect, useRef, useCallback } from 'react'
import { useWebSocketContext, type WebSocketState } from '@/shared/providers/WebSocketProvider'

export type { WebSocketState }

export interface UseWebSocketOptions {
  topics?: string[]
  onMessage?: (data: unknown) => void
  onConnect?: () => void
  onDisconnect?: () => void
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

/**
 * Hook for subscribing to WebSocket topics.
 *
 * Uses the singleton WebSocketProvider under the hood - all components
 * share a single WebSocket connection with dynamic topic subscriptions.
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

  // Stable callback for message handling
  const handleMessage = useCallback(
    (data: unknown) => {
      onMessage?.(data)
    },
    [onMessage]
  )

  // Subscribe to topics
  useEffect(() => {
    if (topics.length === 0) {
      return
    }

    subscriptionIdRef.current = subscribe(topics, handleMessage)

    return () => {
      if (subscriptionIdRef.current) {
        unsubscribe(subscriptionIdRef.current)
        subscriptionIdRef.current = null
      }
    }
  }, [topics.join(','), subscribe, unsubscribe, handleMessage])

  // Call onConnect/onDisconnect callbacks on state changes
  useEffect(() => {
    if (isConnected && !prevConnectedRef.current) {
      onConnect?.()
    } else if (!isConnected && prevConnectedRef.current) {
      onDisconnect?.()
    }
    prevConnectedRef.current = isConnected
  }, [isConnected, onConnect, onDisconnect])

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
        subscriptionIdRef.current = subscribe(topics, handleMessage)
      }
    },
    connectionState,
    connectionId,
  }
}
