import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverAnchor } from '@/shared/ui/popover'
import { SearchDropdown } from './SearchDropdown'
import { useFTSSearch } from '../hooks/useFTSSearch'

const MIN_QUERY_LENGTH = 2
const DROPDOWN_LIMIT = 5

export const SearchBar = () => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const { data, isLoading, isDebouncing } = useFTSSearch(query, DROPDOWN_LIMIT)

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
    setQuery('')
    setIsOpen(false)
  }

  const handleSelectMessage = (id: string) => {
    setIsOpen(false)
    setQuery('')
    navigate(`/messages?highlight=${id}`)
  }

  const handleSelectAtom = (id: string) => {
    setIsOpen(false)
    setQuery('')
    navigate(`/atoms?expand=${id}`)
  }

  const handleSelectTopic = (id: string) => {
    setIsOpen(false)
    setQuery('')
    navigate(`/topics/${id}`)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          {showSpinner ? (
            <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none animate-spin" />
          ) : (
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          )}
          <Input
            ref={inputRef}
            id="global-search"
            type="text"
            placeholder="Search... (/)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
