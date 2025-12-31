import { useState } from 'react'
import { useWebSocket } from '@/shared/hooks'
import type { TaskEvent } from '../types'
import { logger } from '@/shared/utils/logger'

interface UseTaskEventsOptions {
  onTaskEvent?: (event: TaskEvent) => void
  maxEvents?: number
}

export const useTaskEvents = (options: UseTaskEventsOptions = {}) => {
  const { onTaskEvent, maxEvents = 50 } = options
  const [events, setEvents] = useState<TaskEvent[]>([])

  const { isConnected } = useWebSocket({
    topics: ['monitoring'],
    onMessage: (data) => {
      logger.debug('[useTaskEvents] Received WebSocket message:', data)

      if (isTaskEvent(data)) {
        logger.debug('[useTaskEvents] ✅ Valid task event:', data)
        setEvents((prev) => {
          const newEvents = [data, ...prev].slice(0, maxEvents)
          return newEvents
        })
        onTaskEvent?.(data)
      } else {
        logger.debug('[useTaskEvents] ❌ Invalid task event structure:', data)
      }
    },
  })

  return {
    events,
    isConnected,
    clearEvents: () => setEvents([]),
  }
}

function isTaskEvent(data: unknown): data is TaskEvent {
  if (typeof data !== 'object' || data === null) return false
  const event = data as Record<string, unknown>

  // Backend sends: { type: 'task_started' | 'task_completed' | 'task_failed', ... }
  // We normalize to: { type: 'task_event', ... }
  const validTaskEventTypes = ['task_started', 'task_completed', 'task_failed']
  const isValidType = typeof event.type === 'string' && validTaskEventTypes.includes(event.type)

  return (
    isValidType &&
    typeof event.task_name === 'string' &&
    typeof event.status === 'string' &&
    typeof event.timestamp === 'string'
  )
}
