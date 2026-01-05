import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/shared/ui'
import { PageWrapper } from '@/shared/primitives'
import { toast } from 'sonner'
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import { logger } from '@/shared/utils/logger'
import { useWebSocket } from '@/shared/hooks'
import {
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table'
import { createColumns } from './columns'
import { useScoringConfig } from '@/shared/api/scoringConfig'
import { DataTableToolbar } from '@/shared/components/DataTableToolbar'
import { DataTableFacetedFilter } from '@/shared/components/DataTableFacetedFilter'
import { Columns, List, AlertCircle, HelpCircle, CheckCircle2, Siren, X, Lightbulb } from 'lucide-react'
import { MessageList } from '@/features/messages/components/MessageList'
import { MessageDetailPanel } from '@/features/messages/components/MessageDetailPanel'
import { MessagesSummaryHeader } from './MessagesSummaryHeader'
import { messageService } from '@/features/messages/api/messageService'
import type { MessageQueryParams } from '@/features/messages/types'

type LayoutMode = 'list' | 'split'

// Importance options for filter
const importanceOptions = [
  { label: 'Critical', value: 'critical', icon: Siren },
  { label: 'High', value: 'high', icon: AlertCircle },
  { label: 'Medium', value: 'medium', icon: HelpCircle },
  { label: 'Low', value: 'low', icon: CheckCircle2 },
]

const MessagesPage = () => {
  const { t } = useTranslation('messages')
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('list')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)

  // Fetch scoring config for dynamic thresholds
  const { data: scoringConfig } = useScoringConfig()

  // Fetch Topics for Filter
  const { data: topicsData } = useQuery({
    queryKey: ['topics-list'],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.topics)
      return Array.isArray(res.data) ? res.data : res.data.items || []
    }
  })

  // URL param for highlighting message from search
  const highlightMessageId = searchParams.get('highlight')

  // Data table state (mostly for Filters)
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'sent_at', desc: true }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    id: false,
    sent_at: false,
  })
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})

  // Construct API params from state
  const queryParams = useMemo<MessageQueryParams>(() => {
    const params: MessageQueryParams = {
      limit: 50, // Larger chunk size for infinite scroll
      search: globalFilter || undefined
    }

    if (sorting.length > 0) {
      // params.sort_by = sorting[0].id // API might support sort
      // params.sort_order = sorting[0].desc ? 'desc' : 'asc'
    }

    // Extract filters from columnFilters
    const topicFilter = columnFilters.find(f => f.id === 'topic_name' || f.id === 'topic_id')
    if (topicFilter) {
      params.topics = topicFilter.value as string[]
    }

    const importanceFilter = columnFilters.find(f => f.id === 'importance_score')
    if (importanceFilter) {
      params.importance = importanceFilter.value as string[] // Needs backend update to accept custom params or labels
    }

    return params
  }, [sorting, columnFilters, globalFilter])

  // Infinite Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ['messages', queryParams],
    queryFn: ({ pageParam = 1 }) => messageService.getMessages({ ...queryParams, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) {
        return lastPage.page + 1
      }
      return undefined
    },
  })

  // Flatten messages
  const messages = useMemo(() => {
    return data?.pages.flatMap(page => page.items) || []
  }, [data])

  // Compute signal/noise stats for summary header
  const signalNoiseStats = useMemo(() => {
    const items = messages
    const signalCount = items.filter(m => m.noise_classification === 'signal').length
    const noiseCount = items.filter(m => m.noise_classification === 'noise').length
    return {
      signalCount,
      noiseCount,
      total: items.length,
      ratio: items.length > 0 ? signalCount / items.length : 0
    }
  }, [messages])

  // WebSocket for real-time message scoring updates
  useWebSocket({
    topics: ['noise_filtering'],
    onMessage: (data) => {
      const message = data as { topic: string; event: string }
      if (message.topic === 'noise_filtering') {
        if (message.event === 'message_scored' || message.event === 'batch_scored') {
          queryClient.invalidateQueries({ queryKey: ['messages'] })
        }
      }
    },
  })

  // Handle highlight param from search navigation
  useEffect(() => {
    if (highlightMessageId) {
      setSelectedMessageId(highlightMessageId)
      setLayoutMode('split')
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('highlight')
      setSearchParams(newParams, { replace: true })
    }
  }, [highlightMessageId, searchParams, setSearchParams])


  const hasActiveFilters = columnFilters.length > 0 || globalFilter !== ''

  const handleReset = useCallback(() => {
    setColumnFilters([])
    setGlobalFilter('')
    setSorting([{ id: 'sent_at', desc: true }])
  }, [])

  // Dummy ref to satisfy createColumns if we still needed it
  const checkboxClickHandlerRef = React.useRef<((rowId: string, event: React.MouseEvent) => void) | undefined>(undefined)
  const handleCheckboxClick = useCallback((rowId: string, event: React.MouseEvent) => {
    checkboxClickHandlerRef.current?.(rowId, event)
  }, [])

  const columns = useMemo(
    () =>
      createColumns({
        onReset: handleReset,
        hasActiveFilters,
        onCheckboxClick: handleCheckboxClick,
        scoringConfig,
        t,
      }),
    [hasActiveFilters, handleReset, handleCheckboxClick, scoringConfig, t]
  )

  const table = useReactTable({
    data: messages, // Use flattened messages
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: -1, // Infinite
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
  })

  // Handlers for Master-Detail interactions
  const handleMessageSelect = (id: string, _shiftKey: boolean) => {
    setSelectedMessageId(id)
    setLayoutMode('split')
  }

  const handleCreateAtom = (messageId: string) => {
    logger.info(`Create atom for message ${messageId}`)
    toast.info('Atom creation coming soon')
  }

  const handleDismiss = (messageId: string) => {
    logger.info(`Dismiss message ${messageId}`)
    toast.success('Message dismissed')
  }

  const handleClosePanel = () => {
    setLayoutMode('list')
  }

  const handleNextMessage = () => {
    const idx = messages.findIndex(m => String(m.id) === selectedMessageId)
    if (idx !== -1 && idx < messages.length - 1) {
      setSelectedMessageId(String(messages[idx + 1].id))
    }
  }

  const handlePrevMessage = () => {
    const idx = messages.findIndex(m => String(m.id) === selectedMessageId)
    if (idx > 0) {
      setSelectedMessageId(String(messages[idx - 1].id))
    }
  }

  // Keyboard Navigation for List (J/K) & Selection (X)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault()
        if (!selectedMessageId && messages.length > 0) {
          setSelectedMessageId(String(messages[0].id))
        } else {
          handleNextMessage()
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault()
        handlePrevMessage()
      } else if (e.key === 'x') {
        // Toggle selection for current item
        if (selectedMessageId) {
          e.preventDefault()
          const isSelected = !!rowSelection[selectedMessageId]
          setRowSelection(prev => {
            const newSelection = { ...prev }
            if (isSelected) {
              delete newSelection[selectedMessageId]
            } else {
              newSelection[selectedMessageId] = true
            }
            return newSelection
          })
          // Optional: Auto-advance after selection like Gmail? Maybe later.
        }
      } else if (e.key === 'Escape') {
        handleClosePanel()
      } else if (e.key === ']' && e.shiftKey) { // Shift+] to toggle layout
        setLayoutMode(prev => prev === 'list' ? 'split' : 'list')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedMessageId, messages, rowSelection])

  // Topics options
  const topicOptions = useMemo(() => {
    if (!topicsData) return []
    return topicsData.map((t: any) => ({
      label: t.name || t.title || 'Unknown',
      value: t.id || t.name,
    }))
  }, [topicsData])


  return (
    <PageWrapper className="h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-4 md:p-6 gap-4">
      {/* Header Area */}
      <div className="flex flex-col gap-4 flex-shrink-0">
        <MessagesSummaryHeader stats={signalNoiseStats} />

        <div className="flex items-center justify-between gap-2 bg-card rounded-md border p-1 shadow-sm">
          <div className="flex-1 min-w-0 overflow-x-auto pl-2 flex items-center gap-2">
            <DataTableToolbar
              table={table as never}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
              searchPlaceholder={t('filters.searchPlaceholder', 'Введіть текст для пошуку...')}
            >
              {/* Faceted Filters */}
              {table.getColumn('topic_name') && (
                <DataTableFacetedFilter
                  column={table.getColumn('topic_name')}
                  title={t('filters.topics', 'Теми')}
                  options={topicOptions}
                />
              )}

              {table.getColumn('importance_score') && (
                <DataTableFacetedFilter
                  column={table.getColumn('importance_score')}
                  title={t('filters.importance', 'Важливість')}
                  options={importanceOptions}
                />
              )}
            </DataTableToolbar>
          </div>

          <div className="flex items-center gap-2 px-2 border-l">
            <div className="flex items-center bg-muted/50 p-1 rounded-md">
              <Button
                variant={layoutMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setLayoutMode('list')}
                title="List View"
              >
                <List className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">List</span>
              </Button>
              <Button
                variant={layoutMode === 'split' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setLayoutMode('split')}
                title="Split View"
              >
                <Columns className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Split</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Grid Layout */}
      <div className="flex-1 min-h-0 relative rounded-md border bg-card shadow-sm overflow-hidden">
        <div
          className={`
                h-full grid transition-all duration-300 ease-in-out divide-x
                ${layoutMode === 'split' ? 'grid-cols-1 lg:grid-cols-[320px_1fr]' : 'grid-cols-1'}
            `}
        >
          {/* Left Pane - Message List */}
          <div className={`h-full overflow-hidden flex flex-col`}>
            <MessageList
              messages={messages}
              isLoading={isLoading}
              selectedId={selectedMessageId}
              selectedIds={rowSelection}
              onSelect={handleMessageSelect}
              onToggleSelect={(id, checked) => setRowSelection(prev => ({ ...prev, [id]: checked }))}
              onCreateAtom={handleCreateAtom}
              onDismiss={handleDismiss}
              isError={isError}
              error={error as Error} // Cast to Error
              hasMore={hasNextPage}
              onLoadMore={fetchNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          </div>

          {/* Right Pane - Detail Panel */}
          <div className={`h-full overflow-hidden bg-background ${layoutMode === 'list' ? 'hidden' : 'block'}`}>
            <MessageDetailPanel
              messageId={selectedMessageId || ''}
              onClose={handleClosePanel}
              onNext={handleNextMessage}
              onPrev={handlePrevMessage}
            />
          </div>
        </div>
      </div>
      {/* Floating Bulk Actions Bar */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-background/90 backdrop-blur-md border border-border rounded-full shadow-xl px-4 py-2 flex items-center gap-4">
            <span className="text-sm font-medium whitespace-nowrap pl-2 text-foreground">
              {Object.keys(rowSelection).length} {t('selection.selected', 'selected')}
            </span>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full hover:bg-primary/10 hover:text-primary px-3 text-muted-foreground transition-colors"
                onClick={() => {
                  toast.info(`Creating atom from ${Object.keys(rowSelection).length} messages`)
                  setRowSelection({})
                }}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                {t('actions.createAtom', 'Create Atom')}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full hover:bg-destructive/10 hover:text-destructive px-3 text-muted-foreground transition-colors"
                onClick={() => {
                  toast.success(`${Object.keys(rowSelection).length} messages dismissed`)
                  setRowSelection({})
                }}
              >
                <X className="h-4 w-4 mr-2" />
                {t('actions.dismiss', 'Dismiss')}
              </Button>
            </div>

            <div className="h-4 w-px bg-border" />

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full text-muted-foreground hover:bg-muted"
              onClick={() => setRowSelection({})}
              title={t('actions.clearSelection', 'Clear selection')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

export default MessagesPage
