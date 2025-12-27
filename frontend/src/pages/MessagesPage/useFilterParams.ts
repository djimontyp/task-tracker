import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const VALID_FILTERS = ['all', 'signals', 'noise'] as const;

export type FilterMode = (typeof VALID_FILTERS)[number];

export interface UseFilterParamsReturn {
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
}

/**
 * Hook for managing filter mode via URL search params.
 * Provides URL-synchronized filter state for messages page.
 *
 * URL examples:
 * - /messages -> filterMode = 'all'
 * - /messages?filter=signals -> filterMode = 'signals'
 * - /messages?filter=noise -> filterMode = 'noise'
 * - /messages?filter=invalid -> filterMode = 'all' (fallback)
 */
export function useFilterParams(): UseFilterParamsReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawFilter = searchParams.get('filter');
  const filterMode: FilterMode = VALID_FILTERS.includes(rawFilter as FilterMode)
    ? (rawFilter as FilterMode)
    : 'all';

  const setFilterMode = useCallback(
    (mode: FilterMode) => {
      const newParams = new URLSearchParams(searchParams);
      if (mode === 'all') {
        newParams.delete('filter');
      } else {
        newParams.set('filter', mode);
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  return { filterMode, setFilterMode };
}
