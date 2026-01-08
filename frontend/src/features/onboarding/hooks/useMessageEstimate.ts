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

// Single chat estimate response from GET endpoint
interface ChatEstimateResult {
  chat_id: string;
  count: number | null;
  is_estimate: boolean;
  error: string | null;
}

/**
 * Fetch message count estimates from Telegram API
 * Fetches estimates for all depths (24h, 7d, 30d, all) in parallel
 *
 * @param chatIds - List of chat IDs to estimate (required)
 */
async function fetchMessageEstimate(chatIds: string[]): Promise<MessageEstimateResponse> {
  if (chatIds.length === 0) {
    // Return empty response if no chat IDs provided
    return {
      estimates: [],
      total_groups: 0,
      last_updated: new Date().toISOString(),
    };
  }

  // Build query string with chat_ids[] parameter
  const params = new URLSearchParams();
  chatIds.forEach((id) => params.append('chat_ids[]', id));
  const baseParams = params.toString();

  // Fetch all depths in parallel
  const depths: ImportDepth[] = ['24h', '7d', '30d', 'all'];

  const responses = await Promise.all(
    depths.map((depth) =>
      apiClient
        .get<ChatEstimateResult[]>(
          `${API_ENDPOINTS.ingestion.telegramEstimate}?${baseParams}&depth=${depth}`
        )
        .then((res) => ({ depth, data: res.data }))
    )
  );

  // Sum counts for each depth
  const estimates = responses.map(({ depth, data }) => {
    const totalCount = data.reduce((sum, item) => {
      return sum + (item.count ?? 0);
    }, 0);
    return { depth, count: totalCount };
  });

  return {
    estimates,
    total_groups: chatIds.length,
    last_updated: new Date().toISOString(),
  };
}

export interface UseMessageEstimateOptions {
  /** List of chat IDs to estimate */
  chatIds?: string[];
  /** Whether the query is enabled (default: true, but won't fetch without chatIds) */
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
 * const { data, isLoading, isRateLimited, getCountForDepth } = useMessageEstimate({
 *   chatIds: ['-1002531774047'],
 * });
 *
 * // Get count for 7 days
 * const count7d = getCountForDepth('7d'); // e.g., 312
 */
export function useMessageEstimate(
  options: UseMessageEstimateOptions = {}
): UseMessageEstimateReturn {
  const { chatIds = [], enabled = true, refetchOnMount = true } = options;

  // Only fetch if we have chat IDs
  const shouldFetch = enabled && chatIds.length > 0;

  const query = useQuery({
    queryKey: [...MESSAGE_ESTIMATE_QUERY_KEY, chatIds],
    queryFn: () => fetchMessageEstimate(chatIds),
    enabled: shouldFetch,
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
