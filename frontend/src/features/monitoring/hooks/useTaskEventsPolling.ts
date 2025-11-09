import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { monitoringService } from '../api/monitoringService'
import type { TaskExecutionLog } from '../types'

interface UseTaskEventsPollingOptions {
  pollingInterval?: number
  maxEvents?: number
}

export const useTaskEventsPolling = (options: UseTaskEventsPollingOptions = {}) => {
  const { pollingInterval = 3000, maxEvents = 50 } = options
  const [events, setEvents] = useState<TaskExecutionLog[]>([])
  const [lastSeenId, setLastSeenId] = useState<number>(0)

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['monitoring', 'history', 'polling'],
    queryFn: async () => {
      const response = await monitoringService.fetchHistory({
        page: 1,
        page_size: maxEvents,
      })
      return response
    },
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    if (!historyData?.items) return

    const newItems = historyData.items.filter((item: TaskExecutionLog) => item.id > lastSeenId)

    if (newItems.length > 0) {
      console.log(`[useTaskEventsPolling] 📥 Received ${newItems.length} new events`)

      setEvents((prev) => {
        const combined = [...newItems, ...prev].slice(0, maxEvents)
        return combined
      })

      const maxId = Math.max(...newItems.map((item: TaskExecutionLog) => item.id))
      setLastSeenId(maxId)
    }
  }, [historyData, lastSeenId, maxEvents])

  return {
    events,
    isLoading,
    clearEvents: () => {
      setEvents([])
      setLastSeenId(0)
    },
  }
}
