import { useQuery } from '@tanstack/react-query'
import { searchService } from '../api/searchService'
import { useDebounce } from '@/shared/hooks/useDebounce'

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2
const STALE_TIME_MS = 30_000

/**
 * Hook for Full-Text Search with debounce.
 * Automatically fetches results when query is >= 2 characters.
 */
export function useFTSSearch(query: string, limit: number = 5) {
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS)
  const trimmedQuery = debouncedQuery.trim()
  const isEnabled = trimmedQuery.length >= MIN_QUERY_LENGTH

  const queryResult = useQuery({
    queryKey: ['fts-search', trimmedQuery, limit] as const,
    queryFn: () => searchService.searchFTS(trimmedQuery, limit),
    enabled: isEnabled,
    staleTime: STALE_TIME_MS,
  })

  return {
    ...queryResult,
    /** True when user is typing (query differs from debounced) */
    isDebouncing: query.trim() !== trimmedQuery && query.trim().length >= MIN_QUERY_LENGTH,
    /** True when query is too short to search */
    isQueryTooShort: query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH,
  }
}
