/**
 * Consolidated message types for the messages feature module.
 *
 * This file consolidates all Message-related types that were previously
 * scattered across component-specific types.ts files.
 */

// Re-export base Message type from shared (single source of truth)
export type { Message, NoiseClassification, NoiseFactors } from '@/shared/types'

// ============================================================================
// Store Types
// ============================================================================

/**
 * Extended Message type with display-ready fields for the store.
 * Adds computed fields for UI rendering.
 */
export interface MessageList {
  id: number | string
  external_message_id: string
  content: string
  author_id: number
  author_name: string
  sent_at: string
  source_id?: number
  source_name: string
  analyzed?: boolean
  avatar_url?: string | null
  persisted?: boolean
  telegram_profile_id?: number | null
  topic_id?: number | null
  topic_name?: string | null
  importance_score?: number
  noise_classification?: 'noise' | 'signal' | 'weak_signal'
  noise_factors?: {
    content: number
    author: number
    temporal: number
    topics: number
  }
  // Legacy fields
  author?: string
  sender?: string
  text?: string
  timestamp?: string
  source?: string
  telegram_user_id?: number | null
  telegram_username?: string | null
  first_name?: string | null
  last_name?: string | null
  isTask?: boolean
  is_task?: boolean
  taskId?: string
  task_id?: string
  // Display-ready computed fields
  displayTimestamp: string
  displaySource: string
}

export type MessageStatus = 'persisted' | 'pending'

// ============================================================================
// Hook Types
// ============================================================================

export type MessagesPeriod = '24h' | '7d' | '30d' | 'all'

export interface MessageEventPayload {
  type: string
  data?: import('@/shared/types').Message
}

export interface MessageUpdatedPayload {
  id?: number
  external_message_id?: string
  persisted?: boolean
  avatar_url?: string | null
  author_id?: number
  author_name?: string
}

// ============================================================================
// MessageInspectModal Types
// ============================================================================

export interface MessageInspectData {
  message: {
    id: string
    content: string
    source: 'telegram' | 'manual'
    created_at: string
    telegram_message_id?: number
  }
  classification: {
    confidence: number
    reasoning: string
    topic_id: string
    topic_title: string
    noise_score: number
    urgency_score: number
  }
  atoms: {
    entities: {
      people: string[]
      places: string[]
      organizations: string[]
      concepts: string[]
    }
    keywords: Array<{ text: string; relevance: number }>
    embedding?: number[]
    similarMessages?: Array<{
      id: string
      preview: string
      similarity: number
    }>
  }
  history: Array<{
    timestamp: string
    action: 'classified' | 'reassigned' | 'approved' | 'rejected'
    from_topic?: string
    to_topic?: string
    admin_user?: string
    reason?: string
  }>
}

export interface MessageInspectModalProps {
  messageId: string
  onClose: () => void
}

export type TabValue = 'classification' | 'atoms' | 'history'

// ============================================================================
// ConsumerMessageModal Types
// ============================================================================

export interface ConsumerMessageData {
  message: {
    id: string
    content: string
    author: string
    author_name?: string
    avatar_url?: string
    created_at: string
    sent_at?: string
    topic_name?: string
    topic_id?: string
  }
  relatedMessages?: Array<{
    id: string
    content: string
    author: string
    author_name?: string
    sent_at: string
  }>
}

export interface ConsumerMessageModalProps {
  messageId: string
  onClose: () => void
}
