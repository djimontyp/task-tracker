/**
 * Analysis API Service
 */

import { API_ENDPOINTS } from '@/shared/config/api'
import type {
  AnalysisRun,
  AnalysisRunListResponse,
  CreateAnalysisRun,
  AnalysisRunFilters,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

class AnalysisService {
  /**
   * List all analysis runs with optional filters
   */
  async listRuns(
    params?: AnalysisRunFilters
  ): Promise<AnalysisRunListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.set('status', params.status)
    if (params?.trigger_type) queryParams.set('trigger_type', params.trigger_type)
    if (params?.start_date) queryParams.set('start_date', params.start_date)
    if (params?.end_date) queryParams.set('end_date', params.end_date)
    if (params?.skip !== undefined) queryParams.set('skip', params.skip.toString())
    if (params?.limit !== undefined) queryParams.set('limit', params.limit.toString())

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.analysis.runs}?${queryParams.toString()}`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch analysis runs: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create new analysis run
   */
  async createRun(data: CreateAnalysisRun): Promise<AnalysisRun> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.analysis.runs}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(error.detail || 'Failed to create analysis run')
    }

    return response.json()
  }

  /**
   * Get run details by ID
   */
  async getRunDetails(runId: string): Promise<AnalysisRun> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.analysis.run(Number(runId))}`)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Analysis run not found')
      }
      throw new Error(`Failed to fetch run details: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Close analysis run
   */
  async closeRun(runId: string): Promise<AnalysisRun> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.analysis.run(Number(runId))}/close`, {
      method: 'PUT',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(error.detail || 'Failed to close analysis run')
    }

    return response.json()
  }

  /**
   * Start analysis run
   */
  async startRun(runId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.analysis.run(Number(runId))}/start`, {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(error.detail || 'Failed to start analysis run')
    }
  }
}

export const analysisService = new AnalysisService()
