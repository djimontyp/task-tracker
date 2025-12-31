/**
 * Executive Summary API Service
 *
 * T028: API service for Executive Summary feature.
 */

import { apiClient } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/config/api';
import type {
  ExecutiveSummaryResponse,
  ExecutiveSummaryStatsResponse,
  ExportRequest,
  ExportResponse,
  SummaryPeriod,
} from '../types';

class ExecutiveSummaryService {
  /**
   * Get complete executive summary.
   * @param periodDays - Number of days (7, 14, or 30)
   * @param topicId - Optional filter by topic UUID
   */
  async getExecutiveSummary(
    periodDays: SummaryPeriod = 7,
    topicId?: string
  ): Promise<ExecutiveSummaryResponse> {
    const params = new URLSearchParams();
    params.append('period_days', periodDays.toString());
    if (topicId) {
      params.append('topic_id', topicId);
    }

    const response = await apiClient.get<ExecutiveSummaryResponse>(
      `${API_ENDPOINTS.executiveSummary.get}?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get lightweight summary statistics.
   * @param periodDays - Number of days (7, 14, or 30)
   */
  async getSummaryStats(periodDays: SummaryPeriod = 7): Promise<ExecutiveSummaryStatsResponse> {
    const response = await apiClient.get<ExecutiveSummaryStatsResponse>(
      API_ENDPOINTS.executiveSummary.stats(periodDays)
    );
    return response.data;
  }

  /**
   * Export executive summary as formatted report.
   * @param request - Export configuration
   */
  async exportSummary(request: ExportRequest = {}): Promise<ExportResponse> {
    const response = await apiClient.post<ExportResponse>(
      API_ENDPOINTS.executiveSummary.export,
      request
    );
    return response.data;
  }

  /**
   * Download exported report as file.
   * @param request - Export configuration
   */
  async downloadReport(request: ExportRequest = {}): Promise<void> {
    const exportResponse = await this.exportSummary(request);

    // Create blob and trigger download
    const blob = new Blob([exportResponse.content], {
      type: exportResponse.format === 'markdown' ? 'text/markdown' : 'text/plain',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportResponse.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const executiveSummaryService = new ExecutiveSummaryService();
