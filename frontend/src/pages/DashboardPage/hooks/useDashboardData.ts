/**
 * Dashboard Data Hook
 *
 * Centralized data fetching for dashboard components.
 * Uses real API by default for Daily Review Epic.
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import { dashboardService, type DashboardMetricsResponse } from '@/shared/api/dashboard'
import type {
  DashboardMetricsData,
  TrendsResponse,
  RecentInsight,
  TopTopic,
  DashboardPeriod,
} from '../types'
import { isEmptyDashboard } from '../mocks/dashboardMocks'

// Query keys for cache invalidation
export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: (period: DashboardPeriod) => [...dashboardKeys.all, 'metrics', period] as const,
  trends: (period: DashboardPeriod) => [...dashboardKeys.all, 'trends', period] as const,
  insights: () => [...dashboardKeys.all, 'insights'] as const,
  topics: () => [...dashboardKeys.all, 'topics'] as const,
}

/**
 * Transform backend response to frontend metrics format
 */
function transformMetricsResponse(response: DashboardMetricsResponse): DashboardMetricsData {
  const { atoms, trends } = response

  // Map atom types to frontend metric categories
  const problems = atoms.by_type.problem || 0
  const ideas = (atoms.by_type.insight || 0) + (atoms.by_type.pattern || 0)
  const decisions = atoms.by_type.decision || 0
  const questions = atoms.by_type.question || 0

  // Calculate deltas from trends
  const atomsTrend = trends.atoms || { current: 0, previous: 0, change_percent: 0, direction: 'neutral' }
  const delta = atomsTrend.direction === 'up' ? Math.round(atomsTrend.change_percent) :
                atomsTrend.direction === 'down' ? -Math.round(atomsTrend.change_percent) : 0

  return {
    critical: { count: problems, delta: delta },
    ideas: { count: ideas, delta: 0 },
    decisions: { count: decisions, delta: 0 },
    questions: { count: questions, delta: 0 },
  }
}

/**
 * Fetch dashboard metrics (critical, ideas, decisions counts)
 */
export function useDashboardMetrics(period: DashboardPeriod = 'today') {
  return useQuery({
    queryKey: dashboardKeys.metrics(period),
    queryFn: async (): Promise<DashboardMetricsData> => {
      const apiPeriod = period === 'week' || period === 'month' ? 'today' : period
      const response = await dashboardService.getMetrics(apiPeriod)
      return transformMetricsResponse(response)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch trending keywords/topics
 */
export function useDashboardTrends(period: DashboardPeriod = 'week', limit = 5) {
  return useQuery({
    queryKey: dashboardKeys.trends(period),
    queryFn: async (): Promise<TrendsResponse> => {
      const response = await apiClient.get(API_ENDPOINTS.dashboard.trends, {
        params: { period, limit },
      })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    // Trends endpoint not implemented yet - will show error state
    retry: false,
  })
}

/**
 * Fetch recent important insights (atoms with high importance score)
 */
export function useDashboardInsights(limit = 5) {
  return useQuery({
    queryKey: dashboardKeys.insights(),
    queryFn: async (): Promise<RecentInsight[]> => {
      const response = await apiClient.get(API_ENDPOINTS.atoms, {
        params: {
          sort: '-created_at',
          limit,
        },
      })

      // Transform atoms to insights format
      return response.data.items.map((atom: Record<string, unknown>) => ({
        id: atom.id,
        type: (atom.type as string).toUpperCase() as RecentInsight['type'],
        title: atom.title,
        content: atom.content,
        author: 'System',
        topicName: (atom.meta as Record<string, unknown>)?.topic_context as string || 'General',
        topicId: '',
        createdAt: atom.created_at,
        importance: atom.confidence,
      }))
    },
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Fetch top topics by atom count
 */
export function useDashboardTopics(limit = 5) {
  return useQuery({
    queryKey: dashboardKeys.topics(),
    queryFn: async (): Promise<TopTopic[]> => {
      // Use base topics endpoint - it returns all topics
      const response = await apiClient.get(API_ENDPOINTS.topics, {
        params: { limit },
      })

      // Transform to TopTopic format
      return response.data.items.map((topic: Record<string, unknown>) => ({
        id: topic.id,
        name: topic.name,
        icon: topic.icon || 'Folder',
        color: topic.color || '#6B7280',
        atomCount: 0, // TODO: Add atoms_count to topics endpoint
        messageCount: 0, // TODO: Add message_count to topics endpoint
        lastActivityAt: topic.updated_at as string,
      }))
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Combined hook for all dashboard data
 * Returns unified loading/error states
 */
export function useDashboardData(period: DashboardPeriod = 'today') {
  const metrics = useDashboardMetrics(period)
  const trends = useDashboardTrends(period === 'today' ? 'week' : period)
  const insights = useDashboardInsights()
  const topics = useDashboardTopics()

  const isAnyLoading =
    metrics.isLoading || trends.isLoading || insights.isLoading || topics.isLoading

  const hasAnyError = metrics.error || trends.error || insights.error || topics.error

  const hasNoData = metrics.data ? isEmptyDashboard(metrics.data) : false

  return {
    metrics,
    trends,
    insights,
    topics,
    isAnyLoading,
    hasAnyError,
    hasNoData,
    refetchAll: () => {
      metrics.refetch()
      trends.refetch()
      insights.refetch()
      topics.refetch()
    },
  }
}
