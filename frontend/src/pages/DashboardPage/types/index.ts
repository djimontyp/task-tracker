/**
 * Dashboard Page Types
 *
 * Type definitions for the CEO/PM dashboard view.
 * Used with mock data initially, then real API endpoints.
 */

import type { StepStatus } from '@/features/onboarding/types/wizard'
import type { CreateProjectConfig } from '@/features/projects/types'
import type { IndicatorStatus } from '@/shared/hooks'

// Atom types matching backend AtomType enum (backend/app/models/atom.py)
export type AtomType =
  | 'PROBLEM'
  | 'SOLUTION'
  | 'DECISION'
  | 'QUESTION'
  | 'INSIGHT'
  | 'PATTERN'
  | 'REQUIREMENT'

// Subset of atom types for Today's Focus (pending review items)
export type FocusAtomType = 'TASK' | 'IDEA' | 'QUESTION' | 'DECISION' | 'INSIGHT'

/**
 * Focus atom for Today's Focus component
 * Represents atoms with PENDING_REVIEW status
 */
export interface FocusAtom {
  id: number
  title: string
  atom_type: FocusAtomType
  created_at: string
}

/**
 * Props for TodaysFocus component
 */
export interface TodaysFocusProps {
  atoms: FocusAtom[]
  isLoading?: boolean
}

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

/**
 * Props for DashboardPresenter (Container/Presenter pattern)
 * Pure component that receives all data as props
 */
/**
 * Message trend data point for TrendChart
 * API: GET /api/v1/dashboard/message-trends?days=30
 */
export interface MessageTrendPoint {
  date: string // ISO date string (YYYY-MM-DD)
  displayDate: string // Formatted date (d MMM)
  signal: number
  noise: number
}

/**
 * Backend response for message trends
 */
export interface MessageTrendsResponse {
  period_days: number
  data: Array<{ date: string; signal: number; noise: number }>
}

/**
 * Activity day for ActivityHeatmap
 * API: GET /api/v1/activity?period=week
 */
export interface ActivityDay {
  date: Date
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface DashboardPresenterProps {
  // Data from useDashboardData hook
  metrics: {
    data: DashboardMetricsData | undefined
    isLoading: boolean
    error: Error | null
  }
  insights: {
    data: RecentInsight[] | undefined
    isLoading: boolean
    error: Error | null
  }
  topics: {
    data: TopTopic[] | undefined
    isLoading: boolean
    error: Error | null
  }
  focusAtoms: {
    data: FocusAtom[] | undefined
    isLoading: boolean
    error: Error | null
  }

  // Chart data
  trendData?: MessageTrendPoint[]
  trendLoading?: boolean
  activityData?: ActivityDay[]
  activityLoading?: boolean

  // Derived state
  hasNoData: boolean
  isAnyLoading: boolean

  // UI state
  showOnboarding: boolean
  greeting: string
  subtitle: string // Dynamic hero subtitle based on data state

  // Callbacks
  onCloseOnboarding: () => void
  onNavigateToSettings: () => void
  onNavigateToMessages: () => void
  onNavigateToTopics: () => void
  onNavigateToProjects?: () => void
  onNavigateToAgents?: () => void

  // Wizard step statuses
  step2Status: StepStatus
  step3Status: StepStatus
  step4Status: StepStatus
  isWizardCompleted: boolean

  // ProjectForm modal
  projectFormOpen: boolean
  onProjectFormClose: () => void
  onProjectSubmit: (data: CreateProjectConfig) => Promise<void>
  projectFormLoading: boolean
  onCreateProject: () => void

  // Connection status for Pulse indicator
  connectionStatus: IndicatorStatus
}
