import { apiClient } from '@/shared/lib/api/client';
import { API_ENDPOINTS, buildApiPath } from '@/shared/config/api';
import type {
  KnowledgeExtractionRequest,
  KnowledgeExtractionResponse,
  PeriodRequest,
  ExtractionRun,
} from '../types';

export const knowledgeService = {
  async triggerExtraction(
    request: KnowledgeExtractionRequest
  ): Promise<KnowledgeExtractionResponse> {
    const response = await apiClient.post<KnowledgeExtractionResponse>(
      API_ENDPOINTS.knowledge.extract,
      request
    );
    return response.data;
  },

  async triggerExtractionByPeriod(
    period: PeriodRequest,
    agentConfigId: string
  ): Promise<KnowledgeExtractionResponse> {
    return this.triggerExtraction({
      period,
      agent_config_id: agentConfigId,
    });
  },

  async triggerExtractionByMessages(
    messageIds: string[],
    agentConfigId: string,
    includeContext?: boolean,
    contextWindow?: number
  ): Promise<KnowledgeExtractionResponse> {
    return this.triggerExtraction({
      message_ids: messageIds,
      agent_config_id: agentConfigId,
      include_context: includeContext,
      context_window: contextWindow,
    });
  },

  /**
   * Get extraction run status
   */
  async getExtractionStatus(extractionId: string): Promise<ExtractionRun> {
    const response = await apiClient.get<ExtractionRun>(
      buildApiPath(`knowledge/extract/${extractionId}`)
    );
    return response.data;
  },

  /**
   * Cancel a running extraction
   */
  async cancelExtraction(extractionId: string): Promise<void> {
    await apiClient.post(buildApiPath(`knowledge/extract/${extractionId}/cancel`));
  },
};
