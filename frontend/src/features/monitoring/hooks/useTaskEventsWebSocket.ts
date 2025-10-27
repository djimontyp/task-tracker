import { useCallback, useRef, useState } from 'react'
import { useWebSocket } from '@/features/websocket/hooks/useWebSocket'
import { logger } from '@/shared/utils/logger'
import { TaskStatus, type TaskExecutionLog } from '../types'

interface TaskEventData {
  type: 'task_started' | 'task_completed' | 'task_failed'
  task_name: string
  status: string
  timestamp: string
  data: {
    task_id: string
    duration_ms?: number
    error_message?: string
    params?: Record<string, unknown>
  }
}

interface UseTaskEventsWebSocketOptions {
  maxEvents?: number
}

export const useTaskEventsWebSocket = (options: UseTaskEventsWebSocketOptions = {}) => {
  const { maxEvents = 50 } = options
  const [events, setEvents] = useState<TaskExecutionLog[]>([])
  const eventIdCounter = useRef(Date.now())

  const handleMessage = useCallback(
    (data: unknown) => {
      try {
        const event = data as TaskEventData

        if (!event.type || !event.task_name || !event.status) {
          logger.warn('Invalid task event format:', data)
          return
        }

        eventIdCounter.current += 1

        const status = (event.status.toLowerCase() as TaskStatus) || TaskStatus.PENDING

        const logEntry: TaskExecutionLog = {
          id: eventIdCounter.current,
          task_name: event.task_name,
          status,
          task_id: event.data.task_id,
          params: event.data.params ?? null,
          started_at: event.timestamp,
          completed_at: event.data.duration_ms !== undefined ? event.timestamp : null,
          duration_ms: event.data.duration_ms ?? null,
          error_message: event.data.error_message ?? null,
          error_traceback: null,
          created_at: event.timestamp,
        }

        logger.debug('📥 Task event received:', {
          type: event.type,
          task_name: event.task_name,
          status: event.status,
        })

        setEvents((prev) => [logEntry, ...prev].slice(0, maxEvents))
      } catch (error) {
        logger.error('Error processing task event:', error)
      }
    },
    [maxEvents]
  )

  const { isConnected, connectionState } = useWebSocket({
    topics: ['monitoring'],
    onMessage: handleMessage,
    reconnect: true,
    reconnectInterval: 1000,
    maxReconnectAttempts: 5,
  })

  const clearEvents = useCallback(() => {
    setEvents([])
    eventIdCounter.current = Date.now()
  }, [])

  return {
    events,
    isConnected,
    connectionState,
    clearEvents,
  }
}
