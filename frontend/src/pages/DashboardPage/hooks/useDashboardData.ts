/**
 * Dashboard Data Hook
 *
 * Centralized data fetching for dashboard components.
 * Uses mock data by default, toggle USE_MOCK_DATA to switch to real API.
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api/client'
import type {
  DashboardMetricsData,
  TrendsResponse,
  RecentInsight,
  TopTopic,
  DashboardPeriod,
} from '../types'
import {
  delay,
  createMockMetrics,
  createMockTrends,
  createMockInsights,
  createMockTopics,
  isEmptyDashboard,
} from '../mocks/dashboardMocks'

// Toggle this to switch between mock and real API data
const USE_MOCK_DATA = true

// Query keys for cache invalidation
export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: (period: DashboardPeriod) => [...dashboardKeys.all, 'metrics', period] as const,
  trends: (period: DashboardPeriod) => [...dashboardKeys.all, 'trends', period] as const,
  insights: () => [...dashboardKeys.all, 'insights'] as const,
  topics: () => [...dashboardKeys.all, 'topics'] as const,
}

/**
 * Fetch dashboard metrics (critical, ideas, decisions counts)
 */
export function useDashboardMetrics(period: DashboardPeriod = 'today') {
  return useQuery({
    queryKey: dashboardKeys.metrics(period),
    queryFn: async (): Promise<DashboardMetricsData> => {
      if (USE_MOCK_DATA) {
        await delay(400)
        return createMockMetrics()
      }

      // Real API (when endpoint is ready)
      const response = await apiClient.get('/api/v1/dashboard/metrics', {
        params: { period },
      })
      return response.data
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
      if (USE_MOCK_DATA) {
        await delay(300)
        return createMockTrends(limit, period)
      }

      // Real API (when endpoint is ready)
      const response = await apiClient.get('/api/v1/dashboard/trends', {
        params: { period, limit },
      })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch recent important insights (atoms with high importance score)
 */
export function useDashboardInsights(limit = 5) {
  return useQuery({
    queryKey: dashboardKeys.insights(),
    queryFn: async (): Promise<RecentInsight[]> => {
      if (USE_MOCK_DATA) {
        await delay(350)
        return createMockInsights(limit)
      }

      // Real API - can use existing atoms endpoint with filtering
      const response = await apiClient.get('/api/v1/atoms', {
        params: {
          sort: '-created_at',
          limit,
          // importance_gte: 0.65, // When backend supports this filter
        },
      })

      // Transform atoms to insights format
      return response.data.items.map((atom: Record<string, unknown>) => ({
        id: atom.id,
        type: (atom.type as string).toUpperCase() as RecentInsight['type'],
        title: atom.title,
        content: atom.content,
        author: 'System', // Backend doesn't have author yet
        topicName: 'General', // Need to join with topics
        topicId: '',
        createdAt: atom.created_at,
        importance: atom.confidence,
      }))
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - insights change more often
  })
}

/**
 * Fetch top topics by atom count
 */
export function useDashboardTopics(limit = 5) {
  return useQuery({
    queryKey: dashboardKeys.topics(),
    queryFn: async (): Promise<TopTopic[]> => {
      if (USE_MOCK_DATA) {
        await delay(300)
        return createMockTopics(limit)
      }

      // Real API - use existing topics endpoint
      const response = await apiClient.get('/api/v1/topics/recent', {
        params: { limit, period: 'week' },
      })

      // Transform to TopTopic format
      return response.data.items.map((topic: Record<string, unknown>) => ({
        id: topic.id,
        name: topic.name,
        icon: topic.icon || 'Folder',
        color: topic.color || '#6B7280',
        atomCount: topic.atoms_count || 0,
        messageCount: topic.message_count || 0,
        lastActivityAt: topic.last_message_at,
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
