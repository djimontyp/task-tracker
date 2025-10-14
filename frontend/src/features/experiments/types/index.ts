/**
 * Experiments Types
 */

export type ExperimentStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ExperimentPublic {
  id: number
  provider_id: string
  model_name: string
  status: ExperimentStatus
  message_count: number
  accuracy: number | null
  avg_confidence: number | null
  avg_execution_time_ms: number | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ExperimentCreate {
  provider_id: string
  model_name: string
  message_count: number
}

export interface ClassificationAlternative {
  topic_id: number
  topic_name: string
  confidence: number
}

export interface ClassificationResult {
  message_id: number
  message_content: string
  actual_topic_id: number | null
  actual_topic_name: string | null
  predicted_topic_id: number
  predicted_topic_name: string
  confidence: number
  execution_time_ms: number
  reasoning: string
  alternatives: ClassificationAlternative[]
}

export interface ExperimentDetailPublic extends ExperimentPublic {
  confusion_matrix: Record<string, Record<string, number>>
  classification_results: ClassificationResult[]
}

export interface ExperimentListResponse {
  items: ExperimentPublic[]
  total: number
  page: number
  page_size: number
}

export interface ExperimentFilters {
  status?: string
  provider_id?: string
  skip?: number
  limit?: number
}

export interface ExperimentWebSocketEvent {
  type: 'experiment_started' | 'experiment_progress' | 'experiment_completed' | 'experiment_failed'
  experiment_id: number
  message_count?: number
  current?: number
  total?: number
  percentage?: number
  accuracy?: number
  error?: string
}
