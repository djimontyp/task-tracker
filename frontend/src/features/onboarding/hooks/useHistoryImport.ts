import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api/client';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { API_ENDPOINTS } from '@/shared/config/api';
import type {
  ImportDepth,
  ImportStatus,
  ImportProgress,
  ImportJobResponse,
  ImportWebSocketEvent,
  StartImportRequest,
} from '../types';
import { MESSAGE_ESTIMATE_QUERY_KEY } from './useMessageEstimate';

/**
 * Start history import
 */
async function startImport(request: StartImportRequest): Promise<ImportJobResponse> {
  // Use telegram ingestion endpoint (not telegramImport which doesn't exist)
  const response = await apiClient.post<ImportJobResponse>(API_ENDPOINTS.ingestion.telegram, {
    chat_ids: request.chat_ids,
    depth: request.depth,
    limit: 10000, // Default limit
  });
  return response.data;
}

/**
 * Cancel running import
 */
async function cancelImport(jobId: string): Promise<void> {
  await apiClient.post(API_ENDPOINTS.ingestion.telegramImportCancel(jobId));
}

export interface UseHistoryImportOptions {
  onComplete?: (summary: ImportWebSocketEvent & { type: 'import_completed' }) => void;
  onError?: (error: string) => void;
}

export interface UseHistoryImportReturn {
  /** Current import status */
  status: ImportStatus;
  /** Current progress data */
  progress: ImportProgress | null;
  /** Active job ID */
  jobId: string | null;
  /** Whether import is in progress */
  isImporting: boolean;
  /** Whether import can be started */
  canStart: boolean;
  /** Start import with specified depth and chat IDs */
  startImport: (depth: ImportDepth, chatIds: string[]) => void;
  /** Cancel current import */
  cancelImport: () => void;
  /** Reset to idle state */
  reset: () => void;
  /** Mutation loading state */
  isStarting: boolean;
  /** Mutation error */
  startError: Error | null;
}

/**
 * Hook for managing history import process
 *
 * @example
 * const {
 *   status,
 *   progress,
 *   isImporting,
 *   startImport,
 *   cancelImport,
 * } = useHistoryImport({
 *   onComplete: (summary) => toast.success('Import completed!'),
 *   onError: (error) => toast.error(error),
 * });
 *
 * // Start import
 * startImport('7d');
 *
 * // Show progress
 * if (isImporting && progress) {
 *   console.log(`${progress.progress_percent}% complete`);
 * }
 */
export function useHistoryImport(
  options: UseHistoryImportOptions = {}
): UseHistoryImportReturn {
  const { onComplete, onError } = options;
  const queryClient = useQueryClient();

  // Local state
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  // WebSocket subscription for progress updates
  const handleWebSocketMessage = useCallback(
    (data: unknown) => {
      const event = data as ImportWebSocketEvent;

      // Only process events for our job
      if ('job_id' in event && event.job_id !== jobId) return;

      switch (event.type) {
        case 'import_progress':
          setStatus(event.progress.status);
          setProgress(event.progress);
          break;

        case 'import_completed':
          setStatus('completed');
          setProgress((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'completed',
                  progress_percent: 100,
                  fetched: event.summary.total_fetched,
                  stored: event.summary.total_stored,
                  skipped: event.summary.total_skipped,
                }
              : null
          );
          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: MESSAGE_ESTIMATE_QUERY_KEY });
          onComplete?.(event);
          break;

        case 'import_failed':
          setStatus('failed');
          setProgress((prev) =>
            prev ? { ...prev, status: 'failed', error_message: event.error } : null
          );
          onError?.(event.error);
          break;
      }
    },
    [jobId, queryClient, onComplete, onError]
  );

  // Subscribe to WebSocket when job is active
  useWebSocket({
    topics: jobId ? ['ingestion'] : [],
    onMessage: handleWebSocketMessage,
  });

  // Start import mutation
  const startMutation = useMutation({
    mutationFn: startImport,
    onSuccess: (response) => {
      setJobId(response.job_id);
      setStatus('pending');
      setProgress({
        status: 'pending',
        progress_percent: 0,
        fetched: 0,
        stored: 0,
        skipped: 0,
        elapsed_seconds: 0,
      });
    },
    onError: (error: Error) => {
      setStatus('failed');
      onError?.(error.message);
    },
  });

  // Cancel import mutation
  const cancelMutation = useMutation({
    mutationFn: cancelImport,
    onSuccess: () => {
      setStatus('cancelled');
      setProgress((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    },
  });

  const handleStartImport = useCallback(
    (depth: ImportDepth, chatIds: string[]) => {
      if (depth === 'skip') {
        // Skip import - mark as completed and notify parent
        setStatus('completed');
        onComplete?.({
          type: 'import_completed',
          job_id: 'manual_skip',
          summary: {
            total_fetched: 0,
            total_stored: 0,
            total_skipped: 0,
            duration_seconds: 0,
          },
        });
        return;
      }

      if (chatIds.length === 0) {
        onError?.('Please add at least one chat ID');
        return;
      }

      startMutation.mutate({ depth, chat_ids: chatIds });
    },
    [startMutation, onComplete, onError]
  );

  const handleCancelImport = useCallback(() => {
    if (jobId) {
      cancelMutation.mutate(jobId);
    }
  }, [jobId, cancelMutation]);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(null);
    setJobId(null);
  }, []);

  const isImporting = status === 'pending' || status === 'running';
  const canStart = status === 'idle' || status === 'completed' || status === 'failed' || status === 'cancelled';

  return {
    status,
    progress,
    jobId,
    isImporting,
    canStart,
    startImport: handleStartImport,
    cancelImport: handleCancelImport,
    reset,
    isStarting: startMutation.isPending,
    startError: startMutation.error,
  };
}
