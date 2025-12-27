import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const VALID_FILTERS = ['all', 'active', 'archived'] as const;

export type TopicFilterMode = (typeof VALID_FILTERS)[number];

export interface UseTopicFilterParamsReturn {
  filterMode: TopicFilterMode;
  setFilterMode: (mode: TopicFilterMode) => void;
}

/**
 * Hook for managing topic filter mode via URL search params.
 * Provides URL-synchronized filter state for topics page.
 *
 * URL examples:
 * - /topics -> filterMode = 'all'
 * - /topics?filter=active -> filterMode = 'active'
 * - /topics?filter=archived -> filterMode = 'archived'
 * - /topics?filter=invalid -> filterMode = 'all' (fallback)
 */
export function useTopicFilterParams(): UseTopicFilterParamsReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawFilter = searchParams.get('filter');
  const filterMode: TopicFilterMode = VALID_FILTERS.includes(rawFilter as TopicFilterMode)
    ? (rawFilter as TopicFilterMode)
    : 'all';

  const setFilterMode = useCallback(
    (mode: TopicFilterMode) => {
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
