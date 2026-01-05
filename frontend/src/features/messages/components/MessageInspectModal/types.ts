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
  onNext?: () => void
  onPrev?: () => void
}

export type TabValue = 'classification' | 'atoms' | 'history'
