import { useState, useEffect, useRef } from 'react'
import { PageHeader } from '@/shared/components'
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
import { FolderIcon, ChatBubbleLeftRightIcon, MagnifyingGlassIcon, XMarkIcon, Squares2X2Icon, ListBulletIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

type ViewMode = 'grid' | 'list'

const TopicsPage = () => {
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
    mutationFn: ({ topicId, color }: { topicId: number; color: string }) =>
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

  const handleColorChange = (topicId: number, color: string) => {
    updateColorMutation.mutate({ topicId, color })
  }

  const handleAutoPickColor = async (topicId: number) => {
    try {
      const result = await topicService.suggestColor(topicId)
      updateColorMutation.mutate({ topicId, color: result.suggested_color })
    } catch (error) {
      console.error('Failed to suggest color:', error)
    }
  }

  const sortOptions = [
    { label: 'Newest First', value: 'created_desc' },
    { label: 'Oldest First', value: 'created_asc' },
    { label: 'Name A-Z', value: 'name_asc' },
    { label: 'Name Z-A', value: 'name_desc' },
    { label: 'Recently Updated', value: 'updated_desc' },
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
        <h1 className="text-3xl font-bold">Topics</h1>
        <Card className="p-6 border-destructive">
          <div className="flex items-start gap-3">
            <div className="text-destructive text-lg">⚠️</div>
            <div>
              <p className="font-semibold text-destructive mb-1">Error loading data</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Topics"
        description="Manage classification topics for task organization with custom icons and colors"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <ListBulletIcon className="h-4 w-4" /> : <Squares2X2Icon className="h-4 w-4" />}
            </Button>
          </div>
        }
      />

      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex-1 max-w-md relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search topics by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2"
            >
              <XMarkIcon className="h-5 w-5" />
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

        <div className="flex gap-1 border border-border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-9"
          >
            <Squares2X2Icon className="h-4 w-4" />
            <span className="sr-only md:not-sr-only md:ml-2">Grid</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-9"
          >
            <ListBulletIcon className="h-4 w-4" />
            <span className="sr-only md:not-sr-only md:ml-2">List</span>
          </Button>
        </div>

        {debouncedSearch && topics && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Found {topics.total} topics
          </span>
        )}
      </div>

      {topics && topics.items.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.items.map((topic) => (
                <Card
                  key={topic.id}
                  className="p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] cursor-pointer"
                  onClick={() => navigate(`/topics/${topic.id}`)}
                >
                  <div className="flex items-center gap-3 mb-2">
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
                    ID: {topic.id} | Created: {new Date(topic.created_at).toLocaleDateString()}
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
                  <div className="flex items-center gap-3 flex-shrink-0">
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
                    <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </Card>
          )}

          {topics.total > pageSize && (
            <div className="flex flex-col items-center gap-4 mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex}-{endIndex} of {topics.total} topics
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
        <Card className="p-12 border-dashed border-2">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              {debouncedSearch ? (
                <MagnifyingGlassIcon className="h-8 w-8 text-primary" />
              ) : (
                <FolderIcon className="h-8 w-8 text-primary" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {debouncedSearch ? 'No matching topics' : 'No Topics Yet'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {debouncedSearch ? (
                <>
                  No topics found matching <strong>"{debouncedSearch}"</strong>.
                  <br />
                  Try searching with different keywords or clear the search to see all topics.
                </>
              ) : (
                'Topics help organize messages by theme. They are automatically created during AI analysis of your messages.'
              )}
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              {debouncedSearch ? (
                <Button onClick={() => setSearchQuery('')} variant="outline">
                  <XMarkIcon className="mr-2 h-5 w-5" />
                  Clear search
                </Button>
              ) : (
                <>
                  <Button onClick={() => navigate('/messages')}>
                    <ChatBubbleLeftRightIcon className="mr-2 h-5 w-5" />
                    View Messages
                  </Button>
                  <Button onClick={() => navigate('/analysis')} variant="outline">
                    Run Analysis
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default TopicsPage