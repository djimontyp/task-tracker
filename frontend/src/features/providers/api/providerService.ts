/**
 * Provider API Service
 *
 * Client for LLM provider configuration endpoints
 */

import apiClient from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import { AxiosError } from 'axios'
import type {
  LLMProvider,
  LLMProviderCreate,
  LLMProviderUpdate,
  OllamaModelsResponse,
  GeminiModelsResponse,
} from '../types'

class ProviderService {
  /**
   * List all providers with optional filters
   */
  async listProviders(params?: {
    skip?: number
    limit?: number
    active_only?: boolean
  }): Promise<LLMProvider[]> {
    const response = await apiClient.get<LLMProvider[]>(API_ENDPOINTS.providers, {
      params: {
        skip: params?.skip,
        limit: params?.limit,
        active_only: params?.active_only ? 'true' : undefined,
      },
    })
    return response.data
  }

  /**
   * Get single provider by ID
   */
  async getProvider(id: string): Promise<LLMProvider> {
    try {
      const response = await apiClient.get<LLMProvider>(`${API_ENDPOINTS.providers}/${id}`)
      return response.data
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        throw new Error('Provider not found')
      }
      throw error
    }
  }

  /**
   * Create new provider
   */
  async createProvider(data: LLMProviderCreate): Promise<LLMProvider> {
    try {
      const response = await apiClient.post<LLMProvider>(API_ENDPOINTS.providers, data)
      return response.data
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 409) {
          throw new Error('Provider name already exists')
        }
        const detail = error.response?.data?.detail
        throw new Error(detail || 'Failed to create provider')
      }
      throw error
    }
  }

  /**
   * Update existing provider
   */
  async updateProvider(id: string, data: LLMProviderUpdate): Promise<LLMProvider> {
    try {
      const response = await apiClient.put<LLMProvider>(`${API_ENDPOINTS.providers}/${id}`, data)
      return response.data
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          throw new Error('Provider not found')
        }
        const detail = error.response?.data?.detail
        throw new Error(detail || 'Failed to update provider')
      }
      throw error
    }
  }

  /**
   * Delete provider
   */
  async deleteProvider(id: string): Promise<void> {
    try {
      await apiClient.delete(`${API_ENDPOINTS.providers}/${id}`)
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 409) {
          throw new Error('Cannot delete - provider is referenced by agents')
        }
        if (error.response?.status === 404) {
          throw new Error('Provider not found')
        }
        const detail = error.response?.data?.detail
        throw new Error(detail || 'Failed to delete provider')
      }
      throw error
    }
  }

  async fetchOllamaModels(host: string): Promise<OllamaModelsResponse> {
    try {
      const response = await apiClient.get<OllamaModelsResponse>(API_ENDPOINTS.ollamaModels(host))
      return response.data
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          throw new Error('Invalid or empty Ollama host URL')
        }
        if (error.response?.status === 502) {
          throw new Error('Cannot connect to Ollama server. Check if host URL is correct and Ollama is running')
        }
        if (error.response?.status === 504) {
          throw new Error('Request timeout. Ollama server is not responding')
        }
        const detail = error.response?.data?.detail
        throw new Error(detail || 'Failed to fetch Ollama models')
      }
      throw error
    }
  }

  async fetchGeminiModels(providerId: string): Promise<GeminiModelsResponse> {
    try {
      const response = await apiClient.get<GeminiModelsResponse>(
        API_ENDPOINTS.geminiModels,
        { params: { provider_id: providerId } }
      )
      return response.data
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          throw new Error('Provider ID is required')
        }
        if (error.response?.status === 404) {
          throw new Error('Provider not found or has no API key')
        }
        if (error.response?.status === 502) {
          throw new Error('Cannot connect to Gemini API')
        }
        if (error.response?.status === 504) {
          throw new Error('Request timeout. Gemini API is not responding')
        }
        const detail = error.response?.data?.detail
        throw new Error(detail || 'Failed to fetch Gemini models')
      }
      throw error
    }
  }
}

export const providerService = new ProviderService()
