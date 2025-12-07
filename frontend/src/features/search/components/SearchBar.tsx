import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { useDebounce } from '@/shared/hooks/useDebounce'

export const SearchBar = () => {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const navigate = useNavigate()

  const isLoading = query !== debouncedQuery && query.length >= 2

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault()
        const searchInput = document.getElementById('global-search')
        if (searchInput) {
          searchInput.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`)
    }
  }, [debouncedQuery, navigate])

  const handleClear = () => {
    setQuery('')
  }

  return (
    <div className="relative">
      {isLoading ? (
        <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none animate-spin" />
      ) : (
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      )}
      <Input
        id="global-search"
        type="text"
        placeholder="Search topics and messages... (/)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={`pl-10 w-64 ${query.length > 0 ? 'pr-8' : ''}`}
        aria-label="Search topics and messages"
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
  )
}
