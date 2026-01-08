import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/config/api';
import type {
  MessageEstimateResponse,
  MessageEstimateError,
  ImportDepth,
} from '../types';

// Query key for message estimates
export const MESSAGE_ESTIMATE_QUERY_KEY = ['telegram', 'message-estimate'] as const;

/**
 * Fetch message count estimates from Telegram API
 * Returns estimated message counts for each import depth option
 */
async function fetchMessageEstimate(): Promise<MessageEstimateResponse> {
  const response = await apiClient.get<MessageEstimateResponse>(API_ENDPOINTS.ingestion.telegramEstimate);
  return response.data;
}

export interface UseMessageEstimateOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
}

export interface UseMessageEstimateReturn {
  /** Estimate data if available */
  data: MessageEstimateResponse | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Specific error details */
  error: MessageEstimateError | null;
  /** Whether we're rate limited */
  isRateLimited: boolean;
  /** Seconds until rate limit expires */
  retryAfter: number | null;
  /** Refetch function */
  refetch: () => void;
  /** Get count for specific depth */
  getCountForDepth: (depth: ImportDepth) => number | null;
}

/**
 * Hook for fetching message count estimates from Telegram
 *
 * @example
 * const { data, isLoading, isRateLimited, getCountForDepth } = useMessageEstimate();
 *
 * // Get count for 7 days
 * const count7d = getCountForDepth('7d'); // e.g., 312
 */
export function useMessageEstimate(
  options: UseMessageEstimateOptions = {}
): UseMessageEstimateReturn {
  const { enabled = true, refetchOnMount = true } = options;

  const query = useQuery({
    queryKey: MESSAGE_ESTIMATE_QUERY_KEY,
    queryFn: fetchMessageEstimate,
    enabled,
    refetchOnMount,
    staleTime: 5 * 60 * 1000, // 5 minutes - estimates don't change frequently
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors
      if (error instanceof Error && error.message.includes('429')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Parse error for rate limit details
  const parseError = (): MessageEstimateError | null => {
    if (!query.error) return null;

    const error = query.error as Error & { response?: { status?: number; data?: { retry_after?: number; message?: string } } };

    if (error.response?.status === 429) {
      return {
        code: 'rate_limited',
        message: error.response.data?.message || 'Rate limited by Telegram API',
        retry_after: error.response.data?.retry_after,
      };
    }

    if (error.message?.includes('Network') || error.message?.includes('ECONNREFUSED')) {
      return {
        code: 'connection_error',
        message: 'Failed to connect to server',
      };
    }

    return {
      code: 'unknown',
      message: error.message || 'An unknown error occurred',
    };
  };

  const parsedError = parseError();

  const getCountForDepth = (depth: ImportDepth): number | null => {
    if (!query.data?.estimates) return null;
    const estimate = query.data.estimates.find((e) => e.depth === depth);
    return estimate?.count ?? null;
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: parsedError,
    isRateLimited: parsedError?.code === 'rate_limited',
    retryAfter: parsedError?.retry_after ?? null,
    refetch: () => query.refetch(),
    getCountForDepth,
  };
}
