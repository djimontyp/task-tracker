/**
 * Dashboard Page Types
 *
 * Type definitions for the CEO/PM dashboard view.
 * Used with mock data initially, then real API endpoints.
 */

// Atom types matching backend enum
export type AtomType = 'TASK' | 'IDEA' | 'DECISION' | 'PROBLEM' | 'QUESTION' | 'INSIGHT'

// Time period for filtering
export type DashboardPeriod = 'today' | 'yesterday' | 'week' | 'month'

/**
 * Dashboard metrics for the 4 MetricCards
 * API: GET /api/v1/dashboard/metrics?period={period}
 */
export interface DashboardMetricsData {
  critical: MetricValue
  ideas: MetricValue
  decisions: MetricValue
  questions: MetricValue // Open questions without answers
}

export interface MetricValue {
  count: number
  delta: number // Change vs previous period (+2, -1, 0)
}

/**
 * Trend item for TrendsList
 * API: GET /api/v1/dashboard/trends?period={period}&limit=5
 */
export interface Trend {
  keyword: string
  count: number
  delta: number // Change vs previous period
  relatedProblems?: number // Optional: problems mentioning this keyword
}

export interface TrendsResponse {
  trends: Trend[]
  period: DashboardPeriod
}

/**
 * Recent insight (atom) for RecentInsights
 * API: GET /api/v1/atoms?sort=-created_at&limit=5&importance_gte=0.65
 */
export interface RecentInsight {
  id: string
  type: AtomType
  title: string
  content?: string // Optional: first 100 chars for preview
  author: string
  topicName: string
  topicId: string
  topicColor?: string
  createdAt: string // ISO date string
  importance?: number // 0-1 score
}

/**
 * Top topic for TopTopics
 * API: GET /api/v1/topics?sort=-atom_count&limit=5
 */
export interface TopTopic {
  id: string
  name: string
  icon: string // Lucide icon name
  color: string // Hex color
  atomCount: number
  messageCount: number
  lastActivityAt?: string // ISO date string
}

/**
 * Combined dashboard data response
 * Used by useDashboardData hook
 */
export interface DashboardData {
  metrics: DashboardMetricsData
  trends: TrendsResponse
  insights: RecentInsight[]
  topics: TopTopic[]
}

/**
 * Props for dashboard components
 */
export interface DashboardMetricsProps {
  data: DashboardMetricsData | undefined
  isLoading: boolean
  error?: Error | null
}

export interface TrendsListProps {
  data: TrendsResponse | undefined
  isLoading: boolean
  error?: Error | null
  onShowAll?: () => void
}

export interface RecentInsightsProps {
  data: RecentInsight[] | undefined
  isLoading: boolean
  error?: Error | null
  onViewAll?: () => void
  onInsightClick?: (insight: RecentInsight) => void
}

export interface TopTopicsProps {
  data: TopTopic[] | undefined
  isLoading: boolean
  error?: Error | null
  limit?: number
}
