/**
 * Executive Summary Hook
 *
 * T029: Custom hook for managing executive summary state and data fetching.
 * Uses TanStack Query for server state management.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { executiveSummaryService } from '@/features/executive-summary/api/executiveSummaryService';
import type {
  ExecutiveSummaryResponse,
  SummaryPeriod,
  ExportRequest,
  ExportFormat,
} from '@/features/executive-summary/types';
import { PERIOD_STORAGE_KEY, PERIOD_OPTIONS } from '@/features/executive-summary/types';

const QUERY_KEY = ['executive-summary'];

/**
 * Load saved period preference from localStorage.
 */
function loadSavedPeriod(): SummaryPeriod {
  try {
    const saved = localStorage.getItem(PERIOD_STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (parsed === 7 || parsed === 14 || parsed === 30) {
        return parsed;
      }
    }
  } catch {
    // localStorage not available
  }
  return 7; // default
}

/**
 * Save period preference to localStorage.
 */
function savePeriod(period: SummaryPeriod): void {
  try {
    localStorage.setItem(PERIOD_STORAGE_KEY, period.toString());
  } catch {
    // localStorage not available
  }
}

export interface UseExecutiveSummaryOptions {
  /**
   * Initial period in days (default: loaded from localStorage or 7).
   */
  initialPeriod?: SummaryPeriod;

  /**
   * Filter by specific topic UUID.
   */
  topicId?: string;
}

export interface UseExecutiveSummaryReturn {
  /**
   * Executive summary data.
   */
  data: ExecutiveSummaryResponse | undefined;

  /**
   * Whether data is loading.
   */
  isLoading: boolean;

  /**
   * Whether data is being refetched.
   */
  isFetching: boolean;

  /**
   * Error if fetch failed.
   */
  error: Error | null;

  /**
   * Current selected period.
   */
  period: SummaryPeriod;

  /**
   * Change period (auto-saves to localStorage).
   */
  setPeriod: (period: SummaryPeriod) => void;

  /**
   * Current topic filter.
   */
  topicId: string | undefined;

  /**
   * Set topic filter.
   */
  setTopicId: (topicId: string | undefined) => void;

  /**
   * Refetch data.
   */
  refetch: () => void;

  /**
   * Export summary as file download.
   */
  exportSummary: (format?: ExportFormat) => void;

  /**
   * Whether export is in progress.
   */
  isExporting: boolean;

  /**
   * Period options for selector.
   */
  periodOptions: typeof PERIOD_OPTIONS;
}

/**
 * Hook for managing executive summary data and state.
 *
 * Features:
 * - TanStack Query for data fetching and caching
 * - Period preference persistence (localStorage)
 * - Topic filtering (Phase 6)
 * - Export functionality (Phase 4)
 */
export function useExecutiveSummary(
  options: UseExecutiveSummaryOptions = {}
): UseExecutiveSummaryReturn {
  const { t } = useTranslation('executiveSummary');

  // Initialize period from saved preference or default
  const [period, setPeriodState] = useState<SummaryPeriod>(() =>
    options.initialPeriod ?? loadSavedPeriod()
  );

  // Topic filter state (Phase 6)
  const [topicId, setTopicId] = useState<string | undefined>(options.topicId);

  // Period setter with localStorage persistence
  const setPeriod = useCallback((newPeriod: SummaryPeriod) => {
    setPeriodState(newPeriod);
    savePeriod(newPeriod);
  }, []);

  // Main data query
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [...QUERY_KEY, period, topicId],
    queryFn: () => executiveSummaryService.getExecutiveSummary(period, topicId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: (request: ExportRequest) =>
      executiveSummaryService.downloadReport(request),
    onSuccess: () => {
      toast.success(t('toast.exportSuccess'));
    },
    onError: () => {
      toast.error(t('errors.exportFailed'));
    },
  });

  // Export handler
  const exportSummary = useCallback(
    (format: ExportFormat = 'markdown') => {
      exportMutation.mutate({
        period_days: period,
        format,
        include_stats: true,
        include_blockers: true,
        include_decisions: true,
      });
    },
    [period, exportMutation]
  );

  return {
    data,
    isLoading,
    isFetching,
    error: error as Error | null,
    period,
    setPeriod,
    topicId,
    setTopicId,
    refetch,
    exportSummary,
    isExporting: exportMutation.isPending,
    periodOptions: PERIOD_OPTIONS,
  };
}

export default useExecutiveSummary;
