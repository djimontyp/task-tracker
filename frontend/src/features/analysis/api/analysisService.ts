/**
 * Analysis API Service
 */

import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import type {
  AnalysisRun,
  AnalysisRunListResponse,
  CreateAnalysisRun,
  AnalysisRunFilters,
} from '../types'

class AnalysisService {
  /**
   * List all analysis runs with optional filters
   */
  async listRuns(
    params?: AnalysisRunFilters
  ): Promise<AnalysisRunListResponse> {
    const { data } = await apiClient.get<AnalysisRunListResponse>(
      API_ENDPOINTS.analysis.runs,
      { params }
    )
    return data
  }

  /**
   * Create new analysis run
   */
  async createRun(data: CreateAnalysisRun): Promise<AnalysisRun> {
    const response = await apiClient.post<AnalysisRun>(
      API_ENDPOINTS.analysis.runs,
      data
    )
    return response.data
  }

  /**
   * Get run details by ID
   */
  async getRunDetails(runId: string): Promise<AnalysisRun> {
    const { data } = await apiClient.get<AnalysisRun>(
      API_ENDPOINTS.analysis.run(runId)
    )
    return data
  }

  /**
   * Close analysis run
   */
  async closeRun(runId: string): Promise<AnalysisRun> {
    const { data } = await apiClient.put<AnalysisRun>(
      `${API_ENDPOINTS.analysis.run(runId)}/close`
    )
    return data
  }

  /**
   * Start analysis run
   */
  async startRun(runId: string): Promise<void> {
    await apiClient.post(`${API_ENDPOINTS.analysis.run(runId)}/start`)
  }
}

export const analysisService = new AnalysisService()
