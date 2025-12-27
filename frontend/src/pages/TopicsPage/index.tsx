import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, ColorPickerPopover } from '@/shared/components'
import { Spinner, Button, Input } from '@/shared/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/shared/ui/pagination'
import { topicService } from '@/features/topics/api/topicService'
import type { TopicListResponse, TopicSortBy } from '@/features/topics/types'
import { renderTopicIcon } from '@/features/topics/utils/renderIcon'
import { Folder, MessageSquare, Search, X, LayoutGrid, List, ChevronRight } from 'lucide-react'
import { PageWrapper } from '@/shared/primitives'

type ViewMode = 'grid' | 'list'

const TopicsPage = () => {
  const { t } = useTranslation('topics')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<TopicSortBy>('created_desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('topicsViewMode') as ViewMode) || 'grid'
  })
  const pageSize = 24
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem('topicsViewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, sortBy])

  const { data: topics, isLoading, error } = useQuery<TopicListResponse>({
    queryKey: ['topics', {
      page: currentPage,
      search: debouncedSearch,
      sort_by: sortBy
    }],
    queryFn: () => topicService.listTopics({
      page: currentPage,
      page_size: pageSize,
      search: debouncedSearch || undefined,
      sort_by: sortBy,
    }),
  })

  useEffect(() => {
    if (debouncedSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [topics, debouncedSearch])

  const updateColorMutation = useMutation({
    mutationFn: ({ topicId, color }: { topicId: string; color: string }) =>
      topicService.updateTopicColor(topicId, color),
    onMutate: async ({ topicId, color }) => {
      const queryKey = ['topics', { page: currentPage, search: debouncedSearch, sort_by: sortBy }]
      await queryClient.cancelQueries({ queryKey })

      const previousTopics = queryClient.getQueryData<TopicListResponse>(queryKey)

      queryClient.setQueryData<TopicListResponse>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((topic) =>
            topic.id === topicId ? { ...topic, color } : topic
          ),
        }
      })

      return { previousTopics, queryKey }
    },
    onSuccess: (updatedTopic, { topicId }) => {
      const queryKey = ['topics', { page: currentPage, search: debouncedSearch, sort_by: sortBy }]
      queryClient.setQueryData<TopicListResponse>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((topic) =>
            topic.id === topicId ? updatedTopic : topic
          ),
        }
      })
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTopics && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousTopics)
      }
    },
  })

  const handleColorChange = (topicId: string, color: string) => {
    updateColorMutation.mutate({ topicId, color })
  }

  const handleAutoPickColor = async (topicId: string) => {
    try {
      const result = await topicService.suggestColor(topicId)
      updateColorMutation.mutate({ topicId, color: result.suggested_color })
    } catch (error) {
      console.error('Failed to suggest color:', error)
    }
  }

  const sortOptions = [
    { label: t('sort.newestFirst', 'Newest First'), value: 'created_desc' },
    { label: t('sort.oldestFirst', 'Oldest First'), value: 'created_asc' },
    { label: t('sort.nameAZ', 'Name A-Z'), value: 'name_asc' },
    { label: t('sort.nameZA', 'Name Z-A'), value: 'name_desc' },
    { label: t('sort.recentlyUpdated', 'Recently Updated'), value: 'updated_desc' },
  ]

  const totalPages = Math.ceil((topics?.total || 0) / pageSize)
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, topics?.total || 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Card className="p-6 border-destructive">
          <div className="flex items-start gap-4">
            <div className="text-destructive text-lg">⚠️</div>
            <div>
              <p className="font-semibold text-destructive mb-2">{t('error.loading', 'Error loading data')}</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : t('error.unknown', 'Unknown error')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <PageWrapper variant="fullWidth">
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-4 top-2/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={t('filters.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2/2 -translate-y-1/2"
              aria-label={t('filters.clearSearch', 'Clear search')}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <Select value={sortBy} onValueChange={(value) => setSortBy(value as TopicSortBy)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 border border-border rounded-lg p-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-9"
            aria-label={t('view.grid', 'Switch to grid view')}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="sr-only md:not-sr-only md:ml-2">{t('view.gridLabel', 'Grid')}</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-9"
            aria-label={t('view.list', 'Switch to list view')}
          >
            <List className="h-4 w-4" />
            <span className="sr-only md:not-sr-only md:ml-2">{t('view.listLabel', 'List')}</span>
          </Button>
        </div>

        {debouncedSearch && topics && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {t('search.found', 'Found {{count}} topics', { count: topics.total })}
          </span>
        )}
      </div>

      {topics && topics.items.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {topics.items.map((topic) => (
                <Card
                  key={topic.id}
                  className="p-4 sm:p-4 md:p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] cursor-pointer"
                  onClick={() => navigate(`/topics/${topic.id}`)}
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="text-primary flex-shrink-0">
                      {renderTopicIcon(topic.icon, 'h-5 w-5', topic.color)}
                    </div>
                    <h3 className="text-lg font-semibold flex-1">{topic.name}</h3>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ColorPickerPopover
                        color={topic.color || '#64748B'}
                        onColorChange={(color) => handleColorChange(topic.id, color)}
                        onAutoPickClick={() => handleAutoPickColor(topic.id)}
                        disabled={updateColorMutation.isPending}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{topic.description}</p>

                  <div className="text-xs text-muted-foreground">
                    ID: {topic.id} | {t('detail.created')}: {new Date(topic.created_at).toLocaleDateString()}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="divide-y">
              {topics.items.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center gap-4 p-4 hover:bg-accent/5 cursor-pointer transition-colors"
                  onClick={() => navigate(`/topics/${topic.id}`)}
                >
                  <div className="flex-shrink-0 text-primary">
                    {renderTopicIcon(topic.icon, 'h-5 w-5', topic.color)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{topic.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{topic.description}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-xs text-muted-foreground hidden md:block">
                      ID: {topic.id}
                    </span>
                    <span className="text-xs text-muted-foreground hidden lg:block">
                      {new Date(topic.created_at).toLocaleDateString()}
                    </span>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ColorPickerPopover
                        color={topic.color || '#64748B'}
                        onColorChange={(color) => handleColorChange(topic.id, color)}
                        onAutoPickClick={() => handleAutoPickColor(topic.id)}
                        disabled={updateColorMutation.isPending}
                      />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </Card>
          )}

          {topics.total > pageSize && (
            <div className="flex flex-col items-center gap-4 mt-6">
              <p className="text-sm text-muted-foreground">
                {t('pagination.showing', 'Showing {{start}}-{{end}} of {{total}} topics', { start: startIndex, end: endIndex, total: topics.total })}
              </p>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={
                        currentPage === 1
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)

                    if (!showPage) {
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }
                      return null
                    }

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={
                        currentPage === totalPages
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      ) : (
        <Card className="p-6 sm:p-8 md:p-12 border-dashed border-2">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              {debouncedSearch ? (
                <Search className="h-8 w-8 text-primary" />
              ) : (
                <Folder className="h-8 w-8 text-primary" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {debouncedSearch ? t('search.noResults', 'No matching topics') : t('list.empty')}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {debouncedSearch ? (
                <>
                  {t('search.noResultsFor', 'No topics found matching')} <strong>&quot;{debouncedSearch}&quot;</strong>.
                  <br />
                  {t('search.tryClear', 'Try searching with different keywords or clear the search to see all topics.')}
                </>
              ) : (
                t('list.emptyDescription')
              )}
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              {debouncedSearch ? (
                <Button onClick={() => setSearchQuery('')} variant="outline">
                  <X className="mr-2 h-5 w-5" />
                  {t('filters.clearSearch', 'Clear search')}
                </Button>
              ) : (
                <>
                  <Button onClick={() => navigate('/messages')}>
                    <MessageSquare className="mr-2 h-5 w-5" />
                    {t('actions.viewMessages', 'View Messages')}
                  </Button>
                  <Button onClick={() => navigate('/analysis')} variant="outline">
                    {t('actions.runAnalysis', 'Run Analysis')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}
    </PageWrapper>
  )
}

export default TopicsPage