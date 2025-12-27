import { useEffect, useRef, useState } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverAnchor } from '@/shared/ui/popover'
import { SearchDropdown } from './SearchDropdown'
import type { FTSSearchResultsResponse } from './types/fts'

const MIN_QUERY_LENGTH = 2

export interface SearchBarProps {
  /**
   * Current search query (controlled)
   */
  query: string
  /**
   * Called when query changes
   */
  onQueryChange: (query: string) => void
  /**
   * Called when user clicks clear button
   */
  onClear: () => void
  /**
   * Search results data
   */
  data: FTSSearchResultsResponse | undefined
  /**
   * Loading state from API
   */
  isLoading: boolean
  /**
   * Debouncing state (user is still typing)
   */
  isDebouncing: boolean
  /**
   * Called when message is selected
   */
  onSelectMessage: (id: string) => void
  /**
   * Called when atom is selected
   */
  onSelectAtom: (id: string) => void
  /**
   * Called when topic is selected
   */
  onSelectTopic: (id: string) => void
  /**
   * Additional class name
   */
  className?: string
  /**
   * Placeholder text
   */
  placeholder?: string
}

/**
 * SearchBar - Presentational search input with dropdown.
 *
 * This is a controlled component. Use SearchContainer from features/search
 * for the full search experience with state management and API calls.
 */
export function SearchBar({
  query,
  onQueryChange,
  onClear,
  data,
  isLoading,
  isDebouncing,
  onSelectMessage,
  onSelectAtom,
  onSelectTopic,
  className,
  placeholder = 'Search... (/)',
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const showSpinner = isLoading || isDebouncing
  const shouldShowDropdown = query.trim().length >= MIN_QUERY_LENGTH

  // Open dropdown when we have results or loading
  useEffect(() => {
    if (shouldShowDropdown) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [shouldShowDropdown, data])

  // Global keyboard shortcut: / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle Escape key to close dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const handleClear = () => {
    onClear()
    setIsOpen(false)
  }

  const handleSelectMessage = (id: string) => {
    setIsOpen(false)
    onSelectMessage(id)
  }

  const handleSelectAtom = (id: string) => {
    setIsOpen(false)
    onSelectAtom(id)
  }

  const handleSelectTopic = (id: string) => {
    setIsOpen(false)
    onSelectTopic(id)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div className={`relative ${className ?? ''}`}>
          {showSpinner ? (
            <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none animate-spin" />
          ) : (
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          )}
          <Input
            ref={inputRef}
            id="global-search"
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => shouldShowDropdown && setIsOpen(true)}
            className={`pl-10 w-64 ${query.length > 0 ? 'pr-8' : ''}`}
            aria-label="Search topics, messages, and atoms"
            autoComplete="off"
          />
          {query.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-[400px] p-0"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SearchDropdown
          data={data}
          isLoading={isLoading}
          isDebouncing={isDebouncing}
          query={query}
          onSelectMessage={handleSelectMessage}
          onSelectAtom={handleSelectAtom}
          onSelectTopic={handleSelectTopic}
        />
      </PopoverContent>
    </Popover>
  )
}
