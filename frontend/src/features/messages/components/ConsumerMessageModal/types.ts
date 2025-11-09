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
