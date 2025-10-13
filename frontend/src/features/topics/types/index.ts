/**
 * Topic Types
 */

export interface Topic {
  id: number
  name: string
  description: string
  icon?: string
  color?: string
  created_at: string
  updated_at: string
}

export interface CreateTopic {
  name: string
  description: string
  icon?: string
}

export interface UpdateTopic {
  name?: string
  description?: string
  icon?: string
  color?: string
}

export interface TopicListResponse {
  items: Topic[]
  total: number
  page: number
  page_size: number
}
