// Shared TypeScript types and interfaces

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
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
  author: string
  sent_at: string
  source_name: string
  analyzed?: boolean
  avatar_url?: string | null
  persisted?: boolean
  // Legacy compatibility fields
  text?: string
  sender?: string
  timestamp?: string
  source?: string
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
