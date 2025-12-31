import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import type {
  MonitoringMetricsResponse,
  TaskHistoryResponse,
  HistoryFilters,
  ScoringAccuracyResponse,
} from '../types'

class MonitoringService {
  async fetchMetrics(timeWindowHours: number = 24): Promise<MonitoringMetricsResponse> {
    const response = await apiClient.get<MonitoringMetricsResponse>(
      API_ENDPOINTS.monitoring.metrics,
      {
        params: { time_window: timeWindowHours },
      }
    )
    return response.data
  }

  async fetchHistory(filters: HistoryFilters = {}): Promise<TaskHistoryResponse> {
    const response = await apiClient.get<TaskHistoryResponse>(
      API_ENDPOINTS.monitoring.history,
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

  async fetchScoringAccuracy(): Promise<ScoringAccuracyResponse> {
    const response = await apiClient.get<ScoringAccuracyResponse>(
      API_ENDPOINTS.monitoring.scoringAccuracy
    )
    return response.data
  }
}

export const monitoringService = new MonitoringService()
