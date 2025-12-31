/**
 * Noise Filtering API Service
 *
 * Uses axios client for HTTP requests with automatic JSON parsing
 */

import apiClient from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import type { NoiseStats } from '../types'

interface BatchScoringResponse {
  status: string
  messages_queued: number
  total_unscored: number
}

interface ScoreMessageResponse {
  status: string
  message_id: number
}

class NoiseService {
  async getNoiseStats(): Promise<NoiseStats> {
    const response = await apiClient.get<NoiseStats>(API_ENDPOINTS.noise.stats)
    return response.data
  }

  async triggerBatchScoring(limit: number = 100): Promise<BatchScoringResponse> {
    const response = await apiClient.post<BatchScoringResponse>(
      `${API_ENDPOINTS.noise.scoreBatch}?limit=${limit}`
    )
    return response.data
  }

  async scoreMessage(messageId: number): Promise<ScoreMessageResponse> {
    const response = await apiClient.post<ScoreMessageResponse>(
      API_ENDPOINTS.noise.scoreMessage(messageId)
    )
    return response.data
  }
}

export const noiseService = new NoiseService()
