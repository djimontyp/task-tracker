import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
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
    const response = await apiClient.get<PromptListResponse>(API_ENDPOINTS.prompts.list)
    return response.data
  }

  async getPrompt(promptType: PromptType): Promise<PromptConfig> {
    const response = await apiClient.get<PromptConfig>(API_ENDPOINTS.prompts.get(promptType))
    return response.data
  }

  async validatePrompt(request: PromptValidationRequest): Promise<PromptValidationResponse> {
    const response = await apiClient.post<PromptValidationResponse>(API_ENDPOINTS.prompts.validate, request)
    return response.data
  }

  async updatePrompt(promptType: PromptType, request: PromptUpdateRequest): Promise<PromptConfig> {
    const response = await apiClient.put<PromptConfig>(API_ENDPOINTS.prompts.update(promptType), request)
    return response.data
  }
}

export const promptsService = new PromptsService()
