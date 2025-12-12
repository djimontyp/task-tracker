/**
 * Dashboard API Service
 *
 * Service for fetching dashboard metrics from Daily Review Epic API.
 * Maps backend response to frontend types.
 */

import { apiClient } from '@/shared/lib/api/client'

/**
 * Backend API Response Types (matches OpenAPI contract)
 */
export interface MessageStats {
  total: number
  signal_count: number
  noise_count: number
  signal_ratio: number
}

export interface AtomStats {
  total: number
  pending_review: number
  approved: number
  by_type: Record<string, number>
}

export interface TopicStats {
  total: number
  active_today: number
}

export interface TrendData {
  current: number
  previous: number
  change_percent: number
  direction: 'up' | 'down' | 'neutral'
}

export interface DashboardMetricsResponse {
  period: 'today' | 'yesterday'
  period_label: string
  messages: MessageStats
  atoms: AtomStats
  topics: TopicStats
  trends: Record<string, TrendData>
  generated_at: string
}

/**
 * Dashboard API Service
 */
class DashboardService {
  /**
   * Get dashboard metrics
   *
   * @param period - Time period: 'auto', 'today', or 'yesterday'
   * @returns Dashboard metrics with trends
   */
  async getMetrics(period: 'auto' | 'today' | 'yesterday' = 'auto'): Promise<DashboardMetricsResponse> {
    const { data } = await apiClient.get<DashboardMetricsResponse>('/api/v1/dashboard/metrics', {
      params: { period },
    })
    return data
  }
}

export const dashboardService = new DashboardService()
