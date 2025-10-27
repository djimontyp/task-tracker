export interface SchedulerJob {
  id: string
  name: string
  schedule_cron: string
  enabled: boolean
  last_run?: string
  next_run?: string
  status: 'idle' | 'running' | 'success' | 'failed'
  error_message?: string
  created_at: string
  updated_at: string
}

export interface CreateJobRequest {
  name: string
  schedule_cron: string
  enabled: boolean
}

export interface UpdateJobRequest {
  name?: string
  schedule_cron?: string
  enabled?: boolean
}

export interface RuleCondition {
  field: string
  operator: 'gte' | 'lte' | 'eq' | 'ne' | 'contains' | 'starts_with'
  value: string | number
}

export interface AutomationRule {
  id: string
  name: string
  conditions: RuleCondition[]
  action: 'approve' | 'reject' | 'escalate' | 'notify'
  priority: number
  enabled: boolean
  triggered_count: number
  success_rate: number
  last_triggered?: string
  created_at: string
  updated_at: string
}

export interface CreateRuleRequest {
  name: string
  conditions: RuleCondition[]
  action: 'approve' | 'reject' | 'escalate' | 'notify'
  priority: number
  enabled: boolean
}

export interface UpdateRuleRequest {
  name?: string
  conditions?: RuleCondition[]
  action?: 'approve' | 'reject' | 'escalate' | 'notify'
  priority?: number
  enabled?: boolean
}

export interface RuleTemplate {
  id: string
  name: string
  description: string
  conditions: RuleCondition[]
  action: 'approve' | 'reject' | 'escalate' | 'notify'
  priority: number
}

export interface RulePreviewResponse {
  affected_count: number
  versions: Array<{
    id: string
    topic_name: string
    atom_content: string
    confidence?: number
    similarity?: number
  }>
}

export interface NotificationPreferences {
  email_enabled: boolean
  email_address?: string
  telegram_enabled: boolean
  telegram_chat_id?: string
  pending_threshold: number
  daily_digest_enabled: boolean
  digest_time?: string
  digest_frequency: 'daily' | 'weekly'
}

export interface AutomationStats {
  auto_approval_rate: number
  approval_rate_change?: number
  pending_versions_count: number
  total_rules_count: number
  active_rules_count: number
  rejected_today?: number
  escalated?: number
}

export interface AutomationTrend {
  date: string
  auto_approval_rate: number
  approved_count: number
  rejected_count: number
  manual_count: number
}

export interface JobExecutionHistory {
  id: string
  job_id: string
  started_at: string
  completed_at?: string
  status: 'running' | 'success' | 'failed'
  duration_seconds?: number
  error_message?: string
}

export interface WizardFormData {
  schedule: {
    preset: 'hourly' | 'daily' | 'weekly' | 'custom'
    cron_expression: string
  }
  rules: {
    template?: string
    confidence_threshold: number
    similarity_threshold: number
    action: 'approve' | 'reject' | 'manual_review'
  }
  notifications: {
    email_enabled: boolean
    email_address?: string
    telegram_enabled: boolean
    telegram_chat_id?: string
    pending_threshold: number
    digest_enabled: boolean
    digest_frequency: 'daily' | 'weekly'
  }
}
