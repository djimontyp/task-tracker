import { apiClient } from '@/shared/lib/api/client';
import type { KnowledgeExtractionRequest, KnowledgeExtractionResponse, PeriodRequest } from '../types';

export const knowledgeService = {
  async triggerExtraction(
    request: KnowledgeExtractionRequest
  ): Promise<KnowledgeExtractionResponse> {
    const response = await apiClient.post<KnowledgeExtractionResponse>(
      '/api/v1/knowledge/extract',
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
    messageIds: number[],
    agentConfigId: string
  ): Promise<KnowledgeExtractionResponse> {
    return this.triggerExtraction({
      message_ids: messageIds,
      agent_config_id: agentConfigId,
    });
  },
};
