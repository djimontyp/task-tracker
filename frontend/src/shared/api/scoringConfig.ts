/**
 * Scoring Config API Service
 *
 * Fetches noise filtering thresholds and scoring weights from backend.
 * Provides fallback defaults when API is unavailable.
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import { logger } from '@/shared/utils/logger'

/**
 * Scoring weights for importance calculation
 */
export interface ScoringWeights {
  content: number
  author: number
  temporal: number
  topics: number
}

/**
 * Complete scoring configuration from backend
 */
export interface ScoringConfig {
  /** Threshold below which messages are classified as noise (default: 0.30) */
  noise_threshold: number
  /** Threshold above which messages are classified as signal (default: 0.60) */
  signal_threshold: number
  /** Factor weights for importance calculation */
  weights: ScoringWeights
}

/**
 * Default scoring config used as fallback when API is unavailable
 * Calibrated Dec 2025: 0.30/0.60 thresholds match weighted scoring algorithm
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  noise_threshold: 0.30,
  signal_threshold: 0.60,
  weights: {
    content: 0.4,
    author: 0.2,
    temporal: 0.2,
    topics: 0.2,
  },
}

/**
 * Query key for scoring config
 */
export const SCORING_CONFIG_QUERY_KEY = ['config', 'scoring'] as const

class ScoringConfigService {
  /**
   * Fetch scoring configuration from backend
   * Returns default config on error
   */
  async getConfig(): Promise<ScoringConfig> {
    try {
      const { data } = await apiClient.get<ScoringConfig>(API_ENDPOINTS.configScoring)
      return data
    } catch (error) {
      logger.warn('Failed to fetch scoring config, using defaults:', error)
      return DEFAULT_SCORING_CONFIG
    }
  }
}

export const scoringConfigService = new ScoringConfigService()

/**
 * TanStack Query hook for scoring configuration
 *
 * Features:
 * - Caches config for 5 minutes
 * - Returns default config on error
 * - Refetches on window focus (for config changes)
 *
 * @example
 * ```tsx
 * const { data: config } = useScoringConfig()
 * const classification = getClassificationFromScore(score, config)
 * ```
 */
export function useScoringConfig() {
  return useQuery({
    queryKey: SCORING_CONFIG_QUERY_KEY,
    queryFn: () => scoringConfigService.getConfig(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    // Always return data (fallback to defaults)
    placeholderData: DEFAULT_SCORING_CONFIG,
  })
}

/**
 * Derived thresholds for importance badge display
 * Based on scoring config with calculated medium threshold
 */
export interface ImportanceThresholds {
  high: number
  medium: number
  low: number
}

/**
 * Get importance badge thresholds from scoring config
 *
 * Mapping:
 * - High: >= signal_threshold
 * - Medium: >= noise_threshold AND < signal_threshold
 * - Low: < noise_threshold
 */
export function getImportanceThresholds(config: ScoringConfig): ImportanceThresholds {
  return {
    high: config.signal_threshold,
    medium: config.noise_threshold,
    low: 0,
  }
}
