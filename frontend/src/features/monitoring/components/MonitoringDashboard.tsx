import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HealthCards } from './HealthCards'
import { LiveActivityFeed } from './LiveActivityFeed'
import { TaskHistoryTable } from './TaskHistoryTable'
import { ScoringAccuracyCard } from './ScoringAccuracyCard'
import { useTaskEventsWebSocket } from '../hooks/useTaskEventsWebSocket'
import { monitoringService } from '../api/monitoringService'
import type { HistoryFilters } from '../types'

export const MonitoringDashboard = () => {
  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>({ page: 1, page_size: 50 })
  const [timeWindow] = useState(24)

  const { data: metricsData, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['monitoring', 'metrics', timeWindow],
    queryFn: () => monitoringService.fetchMetrics(timeWindow),
    refetchInterval: 30000,
  })

  const { data: historyData, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ['monitoring', 'history', historyFilters],
    queryFn: () => monitoringService.fetchHistory(historyFilters),
    placeholderData: (previousData) => previousData,
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
          <p className="text-muted-foreground mt-2">
            Статус та історія виконання всіх задач системи
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? 'bg-status-connected animate-pulse'
                : connectionState === 'reconnecting'
                  ? 'bg-status-validating animate-pulse'
                  : 'bg-status-error'
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

        <div className="lg:col-span-1 space-y-6">
          <ScoringAccuracyCard />
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
        ) : (
          <TaskHistoryTable
            history={{ total_count: 0, page: 1, page_size: 50, total_pages: 0, items: [] }}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            availableTaskNames={availableTaskNames}
          />
        )}
      </div>
    </div>
  )
}
