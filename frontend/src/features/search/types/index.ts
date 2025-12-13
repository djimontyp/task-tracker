// FTS (Full-Text Search) types
export * from './fts'

// Message data structure from backend
export interface Message {
  id: number
  content: string
  author_id: number
  sent_at: string
  source_id: number
  external_message_id: string
  avatar_url: string | null
  telegram_profile_id: string | null
  topic_id: number | null
  classification: string | null
  confidence: number | null
  analyzed: boolean
  created_at: string
  updated_at: string
}

// Semantic search result structure
export interface MessageSearchResult {
  message: Message
  similarity_score: number  // 0.0-1.0
}

// Atom data structure from backend
export interface Atom {
  id: number
  type: string
  title: string
  content: string
  confidence: number | null
  user_approved: boolean
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
}

// Atom search result structure
export interface AtomSearchResult {
  atom: Atom
  similarity_score: number  // 0.0-1.0
}

// Topic data structure from backend
export interface Topic {
  id: string  // UUID
  name: string
  description: string | null
  icon: string | null
  color: string | null
  created_at: string
  updated_at: string
}

// Topic search result structure
export interface TopicSearchResult {
  topic: Topic
  similarity_score: number  // 0.0-1.0
}
