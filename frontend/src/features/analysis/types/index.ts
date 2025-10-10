/**
 * Analysis Types
 */

export type AnalysisRunStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'reviewed'
  | 'closed'
  | 'failed'
  | 'cancelled'

export type AnalysisRunTriggerType = 'manual' | 'scheduled' | 'custom' | 'webhook'

export interface AnalysisRunAccuracyMetrics {
  proposals_total: number
  proposals_approved: number
  proposals_rejected: number
  approval_rate: number
  rejection_rate: number
  [key: string]: number
}

export interface AnalysisRun {
  id: string
  status: AnalysisRunStatus
  trigger_type: AnalysisRunTriggerType
  time_window_start: string
  time_window_end: string
  created_at: string
  started_at: string | null
  completed_at: string | null
  closed_at: string | null
  agent_assignment_id: string
  project_config_id: string | null
  config_snapshot: Record<string, unknown>
  triggered_by_user_id: number | null
  proposals_total: number
  proposals_approved: number
  proposals_rejected: number
  proposals_pending: number
  total_messages_in_window: number
  messages_after_prefilter: number
  batches_created: number
  llm_tokens_used: number
  cost_estimate: number
  accuracy_metrics: AnalysisRunAccuracyMetrics | null
  error_log: Record<string, unknown> | null
}

export interface CreateAnalysisRun {
  time_window_start: string
  time_window_end: string
  agent_assignment_id: string  // Required - backend validates this
  project_config_id?: string
  trigger_type?: AnalysisRunTriggerType
  triggered_by_user_id?: number
}

export interface AnalysisRunListResponse {
  items: AnalysisRun[]
  total: number
  page: number
  page_size: number
}

export interface AnalysisRunFilters {
  status?: string
  trigger_type?: string
  start_date?: string
  end_date?: string
  skip?: number
  limit?: number
}
