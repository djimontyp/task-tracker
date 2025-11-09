import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { useDebounce } from '@/shared/hooks/useDebounce'

export const SearchBar = () => {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const navigate = useNavigate()

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

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        id="global-search"
        type="text"
        placeholder="Search topics and messages... (/)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 w-64"
        aria-label="Search topics and messages"
      />
    </div>
  )
}
