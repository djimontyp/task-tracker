import { useMemo } from 'react'
import { useWebSocket } from './useWebSocket'

export type IndicatorStatus = 'healthy' | 'warning' | 'error'

/**
 * Service status hook that provides connection indicator based on WebSocket state.
 *
 * Simplified to rely only on WebSocket connection state without additional HTTP health checks.
 */
export const useServiceStatus = () => {
  const { connectionState, isConnected } = useWebSocket()

  const indicator: IndicatorStatus = useMemo(() => {
    switch (connectionState) {
      case 'connected':
        return 'healthy'
      case 'connecting':
      case 'reconnecting':
        return 'warning'
      case 'disconnected':
      default:
        return 'error'
    }
  }, [connectionState])

  return {
    indicator,
    connectionState,
    isWebSocketConnected: isConnected,
  }
}
