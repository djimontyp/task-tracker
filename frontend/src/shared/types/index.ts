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

  // Legacy compatibility fields (deprecated - use new fields above)
  author?: string  // @deprecated Use author_name instead
  sender?: string  // @deprecated Use author_name instead
  text?: string    // @deprecated Use content instead
  timestamp?: string  // @deprecated Use sent_at instead
  source?: string  // @deprecated Use source_name instead

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

export interface TaskStats {
  total: number
  pending: number
  in_progress: number
  completed: number
  cancelled: number
  byPriority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
}
