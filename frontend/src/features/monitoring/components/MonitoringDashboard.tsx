import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { HealthCards } from './HealthCards'
import { LiveActivityFeed } from './LiveActivityFeed'
import { TaskHistoryTable } from './TaskHistoryTable'
import { useTaskEventsWebSocket } from '../hooks/useTaskEventsWebSocket'
import { monitoringService } from '../api/monitoringService'
import type { HistoryFilters } from '../types'

export const MonitoringDashboard = () => {
  const queryClient = useQueryClient()
  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>({ page: 1, page_size: 50 })
  const [timeWindow, setTimeWindow] = useState(24)

  const { data: metricsData, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['monitoring', 'metrics', timeWindow],
    queryFn: () => monitoringService.fetchMetrics(timeWindow),
    refetchInterval: 30000,
  })

  const { data: historyData, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ['monitoring', 'history', historyFilters],
    queryFn: () => monitoringService.fetchHistory(historyFilters),
    keepPreviousData: true,
  })

  const { events, isConnected, connectionState } = useTaskEventsWebSocket({
    maxEvents: 50,
  })

  const handleFilterChange = (newFilters: HistoryFilters) => {
    setHistoryFilters({ ...newFilters, page: 1, page_size: 50 })
  }

  const handlePageChange = (page: number) => {
    setHistoryFilters((prev) => ({ ...prev, page }))
  }

  const availableTaskNames = metricsData?.metrics.map((m) => m.task_name) ?? []

  if (metricsError || historyError) {
    return (
      <div className="p-8 text-center">
        <div className="text-destructive mb-2">Помилка завантаження даних</div>
        <div className="text-sm text-muted-foreground">
          {metricsError ? String(metricsError) : String(historyError)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Моніторинг фонових задач</h1>
          <p className="text-muted-foreground mt-1">
            Статус та історія виконання всіх задач системи
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? 'bg-green-500 animate-pulse'
                : connectionState === 'reconnecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected
              ? 'WebSocket підключено'
              : connectionState === 'reconnecting'
                ? 'Перепідключення...'
                : 'Підключення...'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {metricsLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Завантаження метрик...
            </div>
          ) : (
            <HealthCards metrics={metricsData?.metrics ?? []} />
          )}
        </div>

        <div className="lg:col-span-1">
          <LiveActivityFeed events={events} />
        </div>
      </div>

      <div>
        {historyLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Завантаження історії...
          </div>
        ) : historyData ? (
          <TaskHistoryTable
            history={historyData}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            availableTaskNames={availableTaskNames}
          />
        ) : null}
      </div>
    </div>
  )
}

function formatTaskName(taskName: string): string {
  return taskName
    .replace(/_task$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
