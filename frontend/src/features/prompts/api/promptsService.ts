import { apiClient } from '@/shared/lib/api/client'
import type {
  PromptConfig,
  PromptListResponse,
  PromptType,
  PromptUpdateRequest,
  PromptValidationRequest,
  PromptValidationResponse,
} from '../types'

class PromptsService {
  async listPrompts(): Promise<PromptListResponse> {
    const response = await apiClient.get<PromptListResponse>('/api/v1/prompts')
    return response.data
  }

  async getPrompt(promptType: PromptType): Promise<PromptConfig> {
    const response = await apiClient.get<PromptConfig>(`/api/v1/prompts/${promptType}`)
    return response.data
  }

  async validatePrompt(request: PromptValidationRequest): Promise<PromptValidationResponse> {
    const response = await apiClient.post<PromptValidationResponse>('/api/v1/prompts/validate', request)
    return response.data
  }

  async updatePrompt(promptType: PromptType, request: PromptUpdateRequest): Promise<PromptConfig> {
    const response = await apiClient.put<PromptConfig>(`/api/v1/prompts/${promptType}`, request)
    return response.data
  }
}

export const promptsService = new PromptsService()
