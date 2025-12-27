import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchBar } from '@/shared/components/SearchBar'
import type { FTSSearchResultsResponse } from '@/shared/components/SearchBar/types/fts'
import { useFTSSearch } from '../hooks/useFTSSearch'

const DROPDOWN_LIMIT = 5

export interface SearchContainerProps {
  /**
   * Custom handler for message selection. If not provided,
   * navigates to /messages?highlight={id}
   */
  onSelectMessage?: (id: string) => void
  /**
   * Custom handler for atom selection. If not provided,
   * navigates to /atoms?expand={id}
   */
  onSelectAtom?: (id: string) => void
  /**
   * Custom handler for topic selection. If not provided,
   * navigates to /topics/{id}
   */
  onSelectTopic?: (id: string) => void
  /**
   * Called when search results change
   */
  onResultsChange?: (results: FTSSearchResultsResponse | undefined) => void
  /**
   * Additional class name for the container
   */
  className?: string
  /**
   * Placeholder text for the search input
   */
  placeholder?: string
}

/**
 * SearchContainer - Smart container component for search functionality.
 *
 * Manages:
 * - Search query state
 * - FTS API calls via useFTSSearch hook
 * - Navigation on result selection
 *
 * Uses SearchBar from shared for presentation.
 */
export function SearchContainer({
  onSelectMessage,
  onSelectAtom,
  onSelectTopic,
  onResultsChange,
  className,
  placeholder,
}: SearchContainerProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const { data, isLoading, isDebouncing } = useFTSSearch(query, DROPDOWN_LIMIT)

  // Notify parent when results change
  if (onResultsChange && data !== undefined) {
    onResultsChange(data)
  }

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery)
  }, [])

  const handleClear = useCallback(() => {
    setQuery('')
  }, [])

  const handleSelectMessage = useCallback(
    (id: string) => {
      setQuery('')
      if (onSelectMessage) {
        onSelectMessage(id)
      } else {
        navigate(`/messages?highlight=${id}`)
      }
    },
    [onSelectMessage, navigate]
  )

  const handleSelectAtom = useCallback(
    (id: string) => {
      setQuery('')
      if (onSelectAtom) {
        onSelectAtom(id)
      } else {
        navigate(`/atoms?expand=${id}`)
      }
    },
    [onSelectAtom, navigate]
  )

  const handleSelectTopic = useCallback(
    (id: string) => {
      setQuery('')
      if (onSelectTopic) {
        onSelectTopic(id)
      } else {
        navigate(`/topics/${id}`)
      }
    },
    [onSelectTopic, navigate]
  )

  return (
    <SearchBar
      query={query}
      onQueryChange={handleQueryChange}
      onClear={handleClear}
      data={data}
      isLoading={isLoading}
      isDebouncing={isDebouncing}
      onSelectMessage={handleSelectMessage}
      onSelectAtom={handleSelectAtom}
      onSelectTopic={handleSelectTopic}
      className={className}
      placeholder={placeholder}
    />
  )
}
