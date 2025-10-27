import { apiClient } from '@/shared/lib/api/client'
import type {
  MonitoringMetricsResponse,
  TaskHistoryResponse,
  HistoryFilters,
} from '../types'

class MonitoringService {
  async fetchMetrics(timeWindowHours: number = 24): Promise<MonitoringMetricsResponse> {
    const response = await apiClient.get<MonitoringMetricsResponse>(
      '/api/v1/monitoring/metrics',
      {
        params: { time_window: timeWindowHours },
      }
    )
    return response.data
  }

  async fetchHistory(filters: HistoryFilters = {}): Promise<TaskHistoryResponse> {
    const response = await apiClient.get<TaskHistoryResponse>(
      '/api/v1/monitoring/history',
      {
        params: {
          task_name: filters.task_name,
          status: filters.status,
          start_date: filters.start_date,
          end_date: filters.end_date,
          page: filters.page ?? 1,
          page_size: filters.page_size ?? 50,
        },
      }
    )
    return response.data
  }
}

export const monitoringService = new MonitoringService()
