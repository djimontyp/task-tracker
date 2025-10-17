import { API_ENDPOINTS } from '@/shared/config/api'
import type { NoiseStats } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost'

class NoiseService {
  async getNoiseStats(): Promise<NoiseStats> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.noise.stats}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch noise stats: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  async triggerBatchScoring(limit: number = 100): Promise<{ status: string; messages_queued: number; total_unscored: number }> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.noise.scoreBatch}?limit=${limit}`,
      { method: 'POST' }
    )

    if (!response.ok) {
      throw new Error(`Failed to trigger scoring: ${response.statusText}`)
    }

    return await response.json()
  }

  async scoreMessage(messageId: number): Promise<{ status: string; message_id: number }> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.noise.scoreMessage(messageId)}`,
      { method: 'POST' }
    )

    if (!response.ok) {
      throw new Error(`Failed to score message ${messageId}: ${response.statusText}`)
    }

    return await response.json()
  }
}

export const noiseService = new NoiseService()
