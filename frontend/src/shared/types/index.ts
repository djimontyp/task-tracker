// Shared TypeScript types and interfaces

export type TaskStatus =
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'closed'
  // legacy/client-only fallbacks
  | 'pending'
  | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  // backend (legacy) fields
  category?: string
  source?: string
  createdAt: string
  created_at?: string
  updatedAt: string
  updated_at?: string
  dueDate?: string
  due_date?: string
}

export type NoiseClassification = 'noise' | 'signal' | 'weak_signal'

export interface NoiseFactors {
  content: number
  author: number
  temporal: number
  topics: number
}

export interface Message {
  id: number | string
  external_message_id: string
  content: string

  // New normalized fields (from backend User model)
  author_id: number
  author_name: string  // User.full_name (first_name + last_name)

  sent_at: string
  source_id?: number
  source_name: string
  analyzed?: boolean
  avatar_url?: string | null
  persisted?: boolean

  // Platform-specific profiles
  telegram_profile_id?: number | null

  // Knowledge extraction fields
  topic_id?: number | null
  topic_name?: string | null

  // Noise classification fields
  importance_score?: number
  noise_classification?: NoiseClassification
  noise_factors?: NoiseFactors

  // Legacy compatibility fields - DO NOT USE IN NEW CODE
  /** @deprecated Use author_name instead */
  author?: string
  /** @deprecated Use author_name instead */
  sender?: string
  /** @deprecated Use content instead */
  text?: string
  /** @deprecated Use sent_at instead */
  timestamp?: string
  /** @deprecated Use source_name instead */
  source?: string

  // Telegram user identification (legacy)
  telegram_user_id?: number | null
  telegram_username?: string | null
  first_name?: string | null
  last_name?: string | null

  // Task-related fields
  isTask?: boolean
  is_task?: boolean
  taskId?: string
  task_id?: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface TaskFilters {
  status?: TaskStatus
  priority?: TaskPriority
  search?: string
}

export interface TrendData {
  current: number
  previous: number
  change_percent: number
  direction: 'up' | 'down' | 'neutral'
}

export interface TaskStatusCounts {
  open: number
  in_progress: number
  completed: number
  closed: number
}

export interface TaskStats {
  total_tasks: number
  by_status: TaskStatusCounts

  total_trend: TrendData
  open_trend: TrendData
  in_progress_trend: TrendData
  completed_trend: TrendData
  completion_rate_trend: TrendData

  by_priority: Record<string, number>
  by_category: Record<string, number>
}

export interface SidebarCounts {
  unclosed_runs: number
  pending_proposals: number
}

export interface Topic {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  created_at: string
  updated_at: string
  message_count?: number
  atoms_count?: number
  last_message_at?: string
}

export interface TopicListResponse {
  items: Topic[]
  total: number
  page: number
  page_size: number
}

export type TimePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom'
