import { API_BASE_PATH, API_ENDPOINTS } from '@/shared/config/api'
import type { Message } from '@/shared/types'
import type { MessageQueryParams, MessageInspectData } from '../types'

const API_BASE_URL = ''

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

class MessageService {
  async getMessages(params: MessageQueryParams): Promise<PaginatedResponse<Message>> {
    const queryParams = new URLSearchParams()

    // Pagination
    if (params.page !== undefined) queryParams.set('page', params.page.toString())
    if (params.limit !== undefined) queryParams.set('size', params.limit.toString()) // Backend usually expects 'size' or 'limit', standardizing on 'size' based on PaginatedResponse intuition or consistent usage.

    // Filters
    if (params.search) queryParams.set('search', params.search)
    if (params.topics?.length) queryParams.set('topics', params.topics.join(','))
    if (params.importance?.length) queryParams.set('importance', params.importance.join(','))

    const url = `${API_BASE_URL}${API_ENDPOINTS.messages}?${queryParams.toString()}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`)
    }

    return response.json()
  }

  async getMessagesByTopic(topicId: string): Promise<Message[]> {
    const response = await fetch(`${API_BASE_URL}${API_BASE_PATH}/topics/${topicId}/messages`)

    if (!response.ok) {
      throw new Error(`Failed to fetch messages for topic: ${response.statusText}`)
    }

    const data: { items: Message[], total: number } = await response.json()
    return data.items || []
  }

  async getMessageInspect(messageId: string): Promise<MessageInspectData> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.messageInspect(messageId)}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch message details: ${response.statusText}`)
    }

    return response.json()
  }
}

export const messageService = new MessageService()
