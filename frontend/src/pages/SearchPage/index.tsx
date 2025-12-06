import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, Sparkles } from 'lucide-react'
import { searchService } from '@/features/search'
import { MessageSearchCard, TopicSearchCard } from '@/features/search/components'
import Spinner from '@/shared/ui/Spinner'
import { EmptyState } from '@/shared/patterns'
import { PageWrapper, Center, Stack, Inline } from '@/shared/primitives'

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
      <PageWrapper variant="search">
        <Center maxWidth="2xl" className="text-center">
          <Stack gap="sm" align="center">
            <div className="relative inline-block mb-4">
              <SearchIcon className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
              <Sparkles className="h-6 w-6 text-primary absolute -top-2 -right-2" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold">Semantic Search</h1>
            <p className="text-muted-foreground">
              Use the search bar above or press <kbd className="px-2 py-2 bg-muted rounded border">/</kbd> to begin searching messages
            </p>
            <p className="text-sm text-muted-foreground">
              Supports cross-language search (Ukrainian + English)
            </p>
          </Stack>
        </Center>
      </PageWrapper>
    )
  }

  if (isLoading) {
    return (
      <PageWrapper variant="search">
        <Center fullHeight className="min-h-[50vh]">
          <Stack gap="md" align="center">
            <Spinner size="lg" />
            <p className="text-muted-foreground">Searching for &quot;{query}&quot;...</p>
            <p className="text-xs text-muted-foreground">Using AI-powered semantic search</p>
          </Stack>
        </Center>
      </PageWrapper>
    )
  }

  if (error) {
    return (
      <PageWrapper variant="search">
        <Center maxWidth="2xl" className="text-center">
          <Stack gap="sm" align="center">
            <h1 className="text-2xl font-bold text-destructive">Search Error</h1>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'An error occurred while searching'}
            </p>
          </Stack>
        </Center>
      </PageWrapper>
    )
  }

  const hasTopics = topicResults && topicResults.length > 0
  const hasMessages = messageResults && messageResults.length > 0
  const hasResults = hasTopics || hasMessages
  const totalResults = (topicResults?.length || 0) + (messageResults?.length || 0)

  return (
    <PageWrapper variant="search">
      <Stack gap="lg">
        <header>
          <Inline gap="sm" align="center" className="mb-2">
            <h1 className="text-3xl font-bold">
              Search Results for &quot;{query}&quot;
            </h1>
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          </Inline>
          <p className="text-muted-foreground">
            {totalResults} {totalResults === 1 ? 'result' : 'results'} found
            <span className="text-xs ml-2">(semantic similarity)</span>
          </p>
        </header>

        {!hasResults && (
          <EmptyState
            icon={SearchIcon}
            title="No results found"
            description={`No topics or messages match your search for "${query}". Try different keywords or check your spelling.`}
            iconSize="lg"
          />
        )}

        {hasTopics && (
          <section aria-labelledby="topics-heading">
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
            <Stack gap="md">
              {messageResults.map((result) => (
                <MessageSearchCard key={result.message.id} result={result} />
              ))}
            </Stack>
          </section>
        )}
      </Stack>
    </PageWrapper>
  )
}

export default SearchPage
