import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, Sparkles } from 'lucide-react'
import { searchService } from '@/features/search'
import { MessageSearchCard, TopicSearchCard } from '@/features/search/components'
import Spinner from '@/shared/ui/Spinner'

const SearchPage = () => {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const {
    data: topicResults,
    isLoading: isLoadingTopics,
    error: topicError,
  } = useQuery({
    queryKey: ['semantic-search', 'topics', query],
    queryFn: () => searchService.searchTopics(query, 10, 0.7),
    enabled: query.trim().length >= 2,
  })

  const {
    data: messageResults,
    isLoading: isLoadingMessages,
    error: messageError,
  } = useQuery({
    queryKey: ['semantic-search', 'messages', query],
    queryFn: () => searchService.searchMessages(query, 20, 0.6),
    enabled: query.trim().length >= 2,
  })

  const isLoading = isLoadingTopics || isLoadingMessages
  const error = topicError || messageError

  if (!query.trim()) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative inline-block mb-4">
            <SearchIcon className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
            <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Semantic Search</h1>
          <p className="text-muted-foreground">
            Use the search bar above or press <kbd className="px-2 py-1 bg-muted rounded border">/</kbd> to begin searching messages
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Supports cross-language search (Ukrainian + English)
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Searching for "{query}"...</p>
          <p className="text-xs text-muted-foreground mt-1">Using AI-powered semantic search</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-2 text-destructive">Search Error</h1>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'An error occurred while searching'}
          </p>
        </div>
      </div>
    )
  }

  const hasTopics = topicResults && topicResults.length > 0
  const hasMessages = messageResults && messageResults.length > 0
  const hasResults = hasTopics || hasMessages
  const totalResults = (topicResults?.length || 0) + (messageResults?.length || 0)

  return (
    <div className="container py-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">
            Search Results for "{query}"
          </h1>
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <p className="text-muted-foreground">
          {totalResults} {totalResults === 1 ? 'result' : 'results'} found
          <span className="text-xs ml-2">(semantic similarity)</span>
        </p>
      </div>

      {!hasResults && (
        <div className="text-center py-12">
          <SearchIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-xl font-semibold mb-2">No results found</h2>
          <p className="text-muted-foreground">
            No topics or messages match your search for "{query}"
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Try different keywords or check your spelling
          </p>
        </div>
      )}

      {hasTopics && (
        <section aria-labelledby="topics-heading" className="mb-12">
          <h2 id="topics-heading" className="text-2xl font-semibold mb-4">
            Topics ({topicResults.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topicResults.map((result) => (
              <TopicSearchCard key={result.topic.id} result={result} />
            ))}
          </div>
        </section>
      )}

      {hasMessages && (
        <section aria-labelledby="messages-heading">
          <h2 id="messages-heading" className="text-2xl font-semibold mb-4">
            Messages ({messageResults.length})
          </h2>
          <div className="space-y-4">
            {messageResults.map((result) => (
              <MessageSearchCard key={result.message.id} result={result} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default SearchPage
