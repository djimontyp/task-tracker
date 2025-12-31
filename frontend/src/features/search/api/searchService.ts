import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import type { MessageSearchResult, AtomSearchResult, TopicSearchResult } from '../types'
import type { FTSSearchResultsResponse } from '../types/fts'

// Ollama provider ID for local embeddings
const OLLAMA_PROVIDER_ID = '43739cc7-7bb0-4c9b-8361-93c2ab2b6903'

export const searchService = {
  /**
   * Full-Text Search using PostgreSQL FTS.
   * Returns grouped results (topics, messages, atoms) with highlighted snippets.
   * Use for quick keyword-based search in dropdown.
   */
  searchFTS: async (query: string, limit: number = 10): Promise<FTSSearchResultsResponse> => {
    const { data } = await apiClient.get<FTSSearchResultsResponse>(API_ENDPOINTS.search.fts, {
      params: { q: query, limit },
    })
    return data
  },

  /**
   * Semantic search for messages using pgvector
   * Supports cross-language search (Ukrainian + English)
   */
  searchMessages: async (
    query: string,
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<MessageSearchResult[]> => {
    const { data } = await apiClient.get<MessageSearchResult[]>(API_ENDPOINTS.search.messages, {
      params: {
        query,
        provider_id: OLLAMA_PROVIDER_ID,
        limit,
        threshold,
      },
    })
    return data
  },

  /**
   * Semantic search for atoms using pgvector
   * Supports cross-language search (Ukrainian + English)
   */
  searchAtoms: async (
    query: string,
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<AtomSearchResult[]> => {
    const { data } = await apiClient.get<AtomSearchResult[]>(API_ENDPOINTS.search.atoms, {
      params: {
        query,
        provider_id: OLLAMA_PROVIDER_ID,
        limit,
        threshold,
      },
    })
    return data
  },

  /**
   * Semantic search for topics using pgvector
   * Supports cross-language search (Ukrainian + English)
   */
  searchTopics: async (
    query: string,
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<TopicSearchResult[]> => {
    const { data } = await apiClient.get<TopicSearchResult[]>(API_ENDPOINTS.search.topics, {
      params: {
        query,
        provider_id: OLLAMA_PROVIDER_ID,
        limit,
        threshold,
      },
    })
    return data
  },
}
