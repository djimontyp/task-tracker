/**
 * Project Types
 */

export interface ProjectComponent {
  name: string
  keywords: string[]
  description?: string
}

export interface PriorityRules {
  critical_keywords?: string[]
  high_keywords?: string[]
  medium_keywords?: string[]
  low_keywords?: string[]
  [key: string]: unknown
}

export interface ProjectConfig {
  id: string
  name: string
  description: string
  keywords: string[]
  glossary: Record<string, string>
  components: ProjectComponent[]
  default_assignee_ids: number[]
  pm_user_id: number
  is_active: boolean
  priority_rules: PriorityRules
  version: string
  language: string // ISO 639-1 code: 'uk' | 'en'
  created_at: string
  updated_at: string
}

export interface CreateProjectConfig {
  name: string
  description: string
  keywords: string[]
  glossary?: Record<string, string>
  components?: ProjectComponent[]
  default_assignee_ids?: number[]
  pm_user_id: number
  is_active?: boolean
  priority_rules?: PriorityRules
  version?: string
  language?: string // ISO 639-1 code: 'uk' | 'en', defaults to 'uk'
}

export interface UpdateProjectConfig {
  name?: string
  description?: string
  keywords?: string[]
  glossary?: Record<string, string>
  components?: ProjectComponent[]
  default_assignee_ids?: number[]
  pm_user_id?: number
  is_active?: boolean
  priority_rules?: PriorityRules
  version?: string
  language?: string // ISO 639-1 code: 'uk' | 'en'
}

export interface ProjectListResponse {
  items: ProjectConfig[]
  total: number
  page: number
  page_size: number
}
