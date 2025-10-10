/**
 * Proposal Types
 */

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'merged'

export interface TaskProposal {
  id: string
  analysis_run_id: string
  proposed_title: string
  proposed_description: string
  proposed_priority: string
  proposed_category: string
  proposed_project_id: string | null
  proposed_tags: string[]
  proposed_parent_id: string | null
  source_message_ids: number[]
  message_count: number
  time_span_seconds: number
  proposed_sub_tasks: Record<string, unknown>[] | null
  similar_task_id: string | null
  similarity_score: number | null
  similarity_type: string | null
  diff_summary: Record<string, unknown> | null
  llm_recommendation: string
  confidence: number
  reasoning: string
  project_classification_confidence: number | null
  project_keywords_matched: string[] | null
  status: ProposalStatus
  reviewed_by_user_id: number | null
  reviewed_at: string | null
  review_action: string | null
  review_notes: string | null
  created_at: string
}

export interface ProposalListResponse {
  items: TaskProposal[]
  total: number
  page: number
  page_size: number
}

export interface ProposalFilters {
  run_id?: string
  status?: string
  confidence_min?: number
  confidence_max?: number
  skip?: number
  limit?: number
}

export interface ApproveProposalRequest {
  review_notes?: string
}

export interface RejectProposalRequest {
  reason: string
}

export interface MergeProposalRequest {
  target_task_id: string
}

export interface UpdateProposalRequest {
  proposed_title?: string
  proposed_description?: string
  proposed_priority?: string
  proposed_category?: string
  proposed_project_id?: string | null
  proposed_tags?: string[]
  proposed_parent_id?: string | null
}
