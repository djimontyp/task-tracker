import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import type { DashboardMetrics } from '../types'

class MetricsService {
  async fetchDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await apiClient.get<DashboardMetrics>(API_ENDPOINTS.metrics.dashboard)
    return response.data
  }
}

export const metricsService = new MetricsService()
