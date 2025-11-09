export type PromptType =
  | 'message_scoring'
  | 'classification'
  | 'knowledge_extraction'
  | 'analysis_proposal'

export type ValidationErrorType = 'length' | 'placeholder' | 'syntax'

export interface ValidationError {
  field: ValidationErrorType
  message: string
}

export interface PromptConfig {
  prompt_type: PromptType
  prompt_text: string
  placeholders: string[]
  updated_at: string
  updated_by: string | null
}

export interface PromptValidationRequest {
  prompt_text: string
  prompt_type: PromptType
}

export interface PromptValidationResponse {
  valid: boolean
  errors: ValidationError[]
}

export interface PromptUpdateRequest {
  prompt_text: string
  updated_by?: string | null
}

export interface PromptListResponse {
  prompts: PromptConfig[]
}

export const PROMPT_TYPE_LABELS: Record<PromptType, string> = {
  message_scoring: 'Message Scoring',
  classification: 'Classification',
  knowledge_extraction: 'Knowledge Extraction',
  analysis_proposal: 'Analysis Proposal',
}

export const PROMPT_TYPE_DESCRIPTIONS: Record<PromptType, string> = {
  message_scoring: 'Evaluate message importance and relevance scores',
  classification: 'Categorize messages into predefined topics',
  knowledge_extraction: 'Extract structured knowledge from message content',
  analysis_proposal: 'Generate task proposals from analyzed messages',
}

export const CHARACTER_LIMITS = {
  min: 50,
  max: 2000,
} as const
