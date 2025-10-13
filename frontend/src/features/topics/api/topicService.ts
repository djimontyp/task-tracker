/**
 * Topic API Service
 */

import { API_ENDPOINTS } from '@/shared/config/api'
import type { Topic, TopicListResponse, UpdateTopic } from '../types'

const API_BASE_URL = ''

class TopicService {
  /**
   * List all topics
   */
  async listTopics(): Promise<TopicListResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.topics}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch topics: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get topic by ID
   */
  async getTopicById(id: number): Promise<Topic> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.topics}/${id}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch topic: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get available colors for topics
   */
  async getAvailableColors(): Promise<{ colors: string[] }> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.topics}/colors`)

    if (!response.ok) {
      throw new Error(`Failed to fetch colors: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Update topic
   */
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

  /**
   * Get suggested color for topic
   */
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
