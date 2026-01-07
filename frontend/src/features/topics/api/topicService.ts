import apiClient from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import type { ListTopicsParams, Topic, TopicListResponse, UpdateTopic, SimilarTopic } from '../types'

class TopicService {
  async listTopics(params?: ListTopicsParams): Promise<TopicListResponse> {
    const queryParams: Record<string, string> = {}

    if (params?.page && params?.page_size) {
      const skip = (params.page - 1) * params.page_size
      queryParams.skip = skip.toString()
      queryParams.limit = params.page_size.toString()
    }

    if (params?.search) {
      queryParams.search = params.search
    }

    if (params?.sort_by) {
      queryParams.sort_by = params.sort_by
    }

    if (params?.is_active !== undefined) {
      queryParams.is_active = params.is_active.toString()
    }

    const response = await apiClient.get<TopicListResponse>(API_ENDPOINTS.topics, {
      params: queryParams,
    })
    return response.data
  }

  async getTopicById(id: string): Promise<Topic> {
    const response = await apiClient.get<Topic>(`${API_ENDPOINTS.topics}/${id}`)
    return response.data
  }

  async getAvailableColors(): Promise<{ colors: string[] }> {
    const response = await apiClient.get<{ colors: string[] }>(`${API_ENDPOINTS.topics}/colors`)
    return response.data
  }

  async updateTopic(id: string, data: UpdateTopic): Promise<Topic> {
    const response = await apiClient.patch<Topic>(`${API_ENDPOINTS.topics}/${id}`, data)
    return response.data
  }

  async suggestColor(topicId: string): Promise<{ topic_id: string; suggested_color: string; icon: string }> {
    const response = await apiClient.get<{ topic_id: string; suggested_color: string; icon: string }>(
      `${API_ENDPOINTS.topics}/${topicId}/suggest-color`
    )
    return response.data
  }

  /**
   * Update topic color
   */
  async updateTopicColor(topicId: string, color: string): Promise<Topic> {
    const response = await apiClient.patch<Topic>(`${API_ENDPOINTS.topics}/${topicId}`, { color })
    return response.data
  }

  async archiveTopic(topicId: string): Promise<Topic> {
    const response = await apiClient.patch<Topic>(`${API_ENDPOINTS.topics}/${topicId}/archive`)
    return response.data
  }

  async restoreTopic(topicId: string): Promise<Topic> {
    const response = await apiClient.patch<Topic>(`${API_ENDPOINTS.topics}/${topicId}/restore`)
    return response.data
  }

  /**
   * Get similar topics using semantic search
   * Uses the topic's name and description as query for similarity search
   */
  async getSimilarTopics(
    topicId: string,
    query: string,
    providerId: string,
    limit: number = 5,
    threshold: number = 0.7
  ): Promise<SimilarTopic[]> {
    const response = await apiClient.get<SimilarTopic[]>(API_ENDPOINTS.search.topics, {
      params: {
        query,
        provider_id: providerId,
        limit,
        threshold,
      },
    })
    // Filter out the current topic from results
    return response.data.filter((item) => item.topic.id !== topicId)
  }
}

export const topicService = new TopicService()
