import { API_BASE_PATH } from '@/shared/config/api'
import type { Message } from '@/shared/types'

const API_BASE_URL = ''

interface TopicMessagesResponse {
  items: Message[]
  total: number
}

class MessageService {
  async getMessagesByTopic(topicId: number): Promise<Message[]> {
    const response = await fetch(`${API_BASE_URL}${API_BASE_PATH}/topics/${topicId}/messages`)

    if (!response.ok) {
      throw new Error(`Failed to fetch messages for topic: ${response.statusText}`)
    }

    const data: TopicMessagesResponse = await response.json()
    return data.items || data
  }
}

export const messageService = new MessageService()
