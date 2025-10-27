export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export interface TaskMetrics {
  task_name: string
  total_executions: number
  pending: number
  running: number
  success: number
  failed: number
  avg_duration_ms: number
  success_rate: number
}

export interface MonitoringMetricsResponse {
  time_window_hours: number
  generated_at: string
  metrics: TaskMetrics[]
}

export interface TaskExecutionLog {
  id: number
  task_name: string
  status: TaskStatus
  task_id: string | null
  params: Record<string, unknown> | null
  started_at: string | null
  completed_at: string | null
  duration_ms: number | null
  error_message: string | null
  error_traceback: string | null
  created_at: string
}

export interface TaskHistoryResponse {
  total_count: number
  page: number
  page_size: number
  total_pages: number
  items: TaskExecutionLog[]
}

export interface TaskEvent {
  type: 'task_event'
  task_name: string
  status: TaskStatus
  timestamp: string
  data: {
    task_id?: string
    duration_ms?: number
    error_message?: string
    params?: Record<string, unknown>
  }
}

export interface HistoryFilters {
  task_name?: string
  status?: TaskStatus
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}

export interface ErrorResponse {
  error: string
}
