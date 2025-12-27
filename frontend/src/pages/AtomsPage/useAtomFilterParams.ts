import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const VALID_STATUSES = ['all', 'pending', 'approved', 'rejected'] as const;

export type AtomStatusFilter = (typeof VALID_STATUSES)[number];

export interface UseAtomFilterParamsReturn {
  statusFilter: AtomStatusFilter;
  setStatusFilter: (status: AtomStatusFilter) => void;
}

/**
 * Hook for managing atom status filter via URL search params.
 * Provides URL-synchronized filter state for atoms page.
 *
 * URL examples:
 * - /atoms -> statusFilter = 'all'
 * - /atoms?status=pending -> statusFilter = 'pending'
 * - /atoms?status=approved -> statusFilter = 'approved'
 * - /atoms?status=rejected -> statusFilter = 'rejected'
 * - /atoms?status=invalid -> statusFilter = 'all' (fallback)
 */
export function useAtomFilterParams(): UseAtomFilterParamsReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get('status');
  const statusFilter: AtomStatusFilter = VALID_STATUSES.includes(
    rawStatus as AtomStatusFilter
  )
    ? (rawStatus as AtomStatusFilter)
    : 'all';

  const setStatusFilter = useCallback(
    (status: AtomStatusFilter) => {
      const newParams = new URLSearchParams(searchParams);
      if (status === 'all') {
        newParams.delete('status');
      } else {
        newParams.set('status', status);
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  return { statusFilter, setStatusFilter };
}
