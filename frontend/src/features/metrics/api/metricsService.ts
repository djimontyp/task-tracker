import { apiClient } from '@/shared/lib/api/client'
import type { DashboardMetrics } from '../types'

class MetricsService {
  async fetchDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await apiClient.get<DashboardMetrics>('/api/v1/metrics/dashboard')
    return response.data
  }
}

export const metricsService = new MetricsService()
