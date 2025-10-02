import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWebSocket } from './useWebSocket'

const HEALTH_ENDPOINT = '/api/health'
const HEALTH_CHECK_INTERVAL = 15000
const HEALTH_RETRY_DELAY = 4000
const HEALTH_MAX_RETRIES = 3

export type IndicatorStatus = 'healthy' | 'warning' | 'error'
export type HealthState = 'idle' | 'checking' | 'ok' | 'retrying' | 'error'

interface ServiceStatus {
  indicator: IndicatorStatus
  connectionState: ReturnType<typeof useWebSocket>['connectionState']
  isWebSocketConnected: boolean
  healthState: HealthState
  lastHealthError: string | null
}

const performHealthCheck = async () => {
  const response = await fetch(HEALTH_ENDPOINT, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }
}

export const useServiceStatus = (): ServiceStatus => {
  const { connectionState, isConnected: isWebSocketConnected } = useWebSocket()
  const [healthState, setHealthState] = useState<HealthState>('idle')
  const [lastHealthError, setLastHealthError] = useState<string | null>(null)
  const scheduleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  const clearSchedule = useCallback(() => {
    if (scheduleRef.current) {
      clearTimeout(scheduleRef.current)
      scheduleRef.current = null
    }
  }, [])

  const schedule = useCallback(
    (callback: () => void, delay: number) => {
      clearSchedule()
      scheduleRef.current = setTimeout(callback, delay)
    },
    [clearSchedule]
  )

  const runHealthCycle = useCallback(() => {
    let attempt = 0

    const execute = async () => {
      if (!isMountedRef.current) {
        return
      }

      setHealthState(attempt === 0 ? 'checking' : 'retrying')

      try {
        await performHealthCheck()

        if (!isMountedRef.current) {
          return
        }

        setHealthState('ok')
        setLastHealthError(null)
        schedule(runHealthCycle, HEALTH_CHECK_INTERVAL)
      } catch (error) {
        if (!isMountedRef.current) {
          return
        }

        const message = error instanceof Error ? error.message : 'Health check failed'
        setLastHealthError(message)
        attempt += 1

        if (attempt > HEALTH_MAX_RETRIES) {
          setHealthState('error')
          schedule(runHealthCycle, HEALTH_CHECK_INTERVAL)
        } else {
          schedule(execute, HEALTH_RETRY_DELAY)
        }
      }
    }

    execute()
  }, [schedule])

  useEffect(() => {
    isMountedRef.current = true
    runHealthCycle()

    return () => {
      isMountedRef.current = false
      clearSchedule()
    }
  }, [runHealthCycle, clearSchedule])

  const indicator: IndicatorStatus = useMemo(() => {
    if (connectionState === 'disconnected') {
      return 'error'
    }

    if (connectionState === 'connecting' || connectionState === 'reconnecting') {
      return 'warning'
    }

    if (healthState === 'error') {
      return 'error'
    }

    if (healthState === 'retrying' || healthState === 'checking') {
      return 'warning'
    }

    return 'healthy'
  }, [connectionState, healthState])

  return {
    indicator,
    connectionState,
    isWebSocketConnected,
    healthState,
    lastHealthError,
  }
}
