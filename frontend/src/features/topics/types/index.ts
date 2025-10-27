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

export type TopicSortBy =
  | 'name_asc'
  | 'name_desc'
  | 'created_desc'
  | 'created_asc'
  | 'updated_desc'

export interface ListTopicsParams {
  page?: number
  page_size?: number
  search?: string
  sort_by?: TopicSortBy
}
