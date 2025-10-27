import { API_ENDPOINTS } from '@/shared/config/api'
import type { ListTopicsParams, Topic, TopicListResponse, UpdateTopic } from '../types'

const API_BASE_URL = ''

class TopicService {
  async listTopics(params?: ListTopicsParams): Promise<TopicListResponse> {
    const queryParams = new URLSearchParams()

    if (params?.page && params?.page_size) {
      const skip = (params.page - 1) * params.page_size
      queryParams.append('skip', skip.toString())
      queryParams.append('limit', params.page_size.toString())
    }

    if (params?.search) {
      queryParams.append('search', params.search)
    }

    if (params?.sort_by) {
      queryParams.append('sort_by', params.sort_by)
    }

    const queryString = queryParams.toString()
    const url = `${API_BASE_URL}${API_ENDPOINTS.topics}${queryString ? '?' + queryString : ''}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch topics: ${response.statusText}`)
    }

    return response.json()
  }

  async getTopicById(id: number): Promise<Topic> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.topics}/${id}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch topic: ${response.statusText}`)
    }

    return response.json()
  }

  async getAvailableColors(): Promise<{ colors: string[] }> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.topics}/colors`)

    if (!response.ok) {
      throw new Error(`Failed to fetch colors: ${response.statusText}`)
    }

    return response.json()
  }

  async updateTopic(id: number, data: UpdateTopic): Promise<Topic> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.topics}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to update topic: ${response.statusText}`)
    }

    return response.json()
  }

  async suggestColor(topicId: number): Promise<{ topic_id: number; suggested_color: string; icon: string }> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.topics}/${topicId}/suggest-color`)

    if (!response.ok) {
      throw new Error(`Failed to suggest color: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Update topic color
   */
  async updateTopicColor(topicId: number, color: string): Promise<Topic> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.topics}/${topicId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ color }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update topic color: ${response.statusText}`)
    }

    return response.json()
  }
}

export const topicService = new TopicService()
