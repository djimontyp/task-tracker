import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Button, Tabs, TabsList, TabsTrigger } from '@/shared/ui'
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
import { Columns, List, AlertCircle, HelpCircle, CheckCircle2, Siren, X, Lightbulb, Sparkles, Calendar } from 'lucide-react'
import { MessageList } from '@/features/messages/components/MessageList'
import { SmartBatchBanner } from '@/features/messages/components/SmartBatchBanner'
import { MessageDetailPanel } from '@/features/messages/components/MessageDetailPanel'
import { MessagesSummaryHeader } from './MessagesSummaryHeader'
import { messageService } from '@/features/messages/api/messageService'
import type { MessageQueryParams } from '@/features/messages/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui'
import { KnowledgeExtractionPanel } from '@/features/knowledge/components/KnowledgeExtractionPanel'

type LayoutMode = 'list' | 'split'

// Stable topics array - defined outside component to prevent re-renders
const WEBSOCKET_TOPICS: string[] = ['noise_filtering']

const MessagesPage = () => {
  const { t } = useTranslation('messages')
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('list')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [showExtractionDialog, setShowExtractionDialog] = useState(false)
  const [visibleDate, setVisibleDate] = useState<string | null>(null)

  // Importance options for filter - stable reference
  // Note: t function identity changes on language switch, which is intentional
  // Using empty deps would cause stale translations
  const importanceOptions = useMemo(() => [
    { label: t('importanceLevels.critical'), value: 'critical', icon: Siren },
    { label: t('importanceLevels.high'), value: 'high', icon: AlertCircle },
    { label: t('importanceLevels.medium'), value: 'medium', icon: HelpCircle },
    { label: t('importanceLevels.low'), value: 'low', icon: CheckCircle2 },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t('importanceLevels.critical')])

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

  // Infinite Query with keepPreviousData to prevent skeleton flicker
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
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1
      }
      return undefined
    },
    // Keep previous data during refetch to prevent skeleton flicker
    placeholderData: (previousData) => previousData,
    // Refetch in background without showing loading state
    refetchOnWindowFocus: false,
  })

  // Flatten messages
  const messages = useMemo(() => {
    return data?.pages.flatMap(page => page.items) || []
  }, [data])

  // Refs for stable access without triggering re-renders
  // These refs are used by effects and callbacks to access current values
  const messagesRef = React.useRef(messages)
  const selectedMessageIdRef = React.useRef(selectedMessageId)
  const rowSelectionRef = React.useRef(rowSelection)

  // Keep refs in sync (synchronous, no effect trigger)
  messagesRef.current = messages
  selectedMessageIdRef.current = selectedMessageId
  rowSelectionRef.current = rowSelection

  // Get total count from first page (API provides consistent total)
  const totalMessages = data?.pages[0]?.total

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

  // WebSocket handler - stable callback (useWebSocket uses refs internally)
  const handleWebSocketMessage = useCallback((data: unknown) => {
    const message = data as { topic: string; event: string }
    if (message.topic === 'noise_filtering') {
      if (message.event === 'message_scored' || message.event === 'batch_scored') {
        // Soft invalidation - marks data as stale but keeps showing it
        // Next user interaction will trigger background refetch
        queryClient.invalidateQueries({
          queryKey: ['messages'],
          refetchType: 'none' // Don't auto-refetch, just mark stale
        })
      }
    }
  }, [queryClient])

  // WebSocket for real-time message scoring updates
  // Use refetchType: 'none' to prevent skeleton flicker - data updates silently in background
  // Note: topics array is converted to string key internally by useWebSocket
  useWebSocket({
    topics: WEBSOCKET_TOPICS,
    onMessage: handleWebSocketMessage,
  })

  // Handle highlight param from search navigation
  useEffect(() => {
    if (highlightMessageId) {
      setSelectedMessageId(highlightMessageId)
      setLayoutMode('split')
      // Remove highlight param from URL after processing
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        newParams.delete('highlight')
        return newParams
      }, { replace: true })
    }
  }, [highlightMessageId, setSearchParams])


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

  // Columns memo - t dependency is intentional for i18n updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columns = useMemo(
    () =>
      createColumns({
        onReset: handleReset,
        hasActiveFilters,
        onCheckboxClick: handleCheckboxClick,
        scoringConfig,
        t,
      }),
    // Using stable string from t() to detect language changes without t identity issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasActiveFilters, handleReset, handleCheckboxClick, scoringConfig, t('columns.author')]
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

  // Prefetch message inspect data to prevent skeleton flicker on navigation
  const prefetchMessageInspect = useCallback((messageId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['messageInspect', messageId],
      queryFn: async () => {
        const response = await fetch(API_ENDPOINTS.messageInspect(messageId))
        if (!response.ok) throw new Error('Failed to prefetch')
        return response.json()
      },
      staleTime: 30_000,
    })
  }, [queryClient])

  // Prefetch adjacent messages when current selection changes
  // Uses messagesRef to avoid re-running on every messages array change
  useEffect(() => {
    if (!selectedMessageId) return

    const currentMessages = messagesRef.current
    if (currentMessages.length === 0) return

    const idx = currentMessages.findIndex(m => String(m.id) === selectedMessageId)
    if (idx === -1) return

    // Prefetch next 2 messages
    if (idx < currentMessages.length - 1) {
      prefetchMessageInspect(String(currentMessages[idx + 1].id))
    }
    if (idx < currentMessages.length - 2) {
      prefetchMessageInspect(String(currentMessages[idx + 2].id))
    }
    // Prefetch previous message
    if (idx > 0) {
      prefetchMessageInspect(String(currentMessages[idx - 1].id))
    }
  }, [selectedMessageId, prefetchMessageInspect])

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

  const handleNextMessage = useCallback(() => {
    const currentMessages = messagesRef.current
    const currentId = selectedMessageIdRef.current
    const idx = currentMessages.findIndex(m => String(m.id) === currentId)
    if (idx !== -1 && idx < currentMessages.length - 1) {
      setSelectedMessageId(String(currentMessages[idx + 1].id))
    }
  }, [])

  const handlePrevMessage = useCallback(() => {
    const currentMessages = messagesRef.current
    const currentId = selectedMessageIdRef.current
    const idx = currentMessages.findIndex(m => String(m.id) === currentId)
    if (idx > 0) {
      setSelectedMessageId(String(currentMessages[idx - 1].id))
    }
  }, [])

  // Keyboard Navigation for List (J/K) & Selection (X)
  // Uses refs to avoid re-attaching listener on every state change
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const currentMessages = messagesRef.current
      const currentSelectedId = selectedMessageIdRef.current
      const currentRowSelection = rowSelectionRef.current

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault()
        if (!currentSelectedId && currentMessages.length > 0) {
          setSelectedMessageId(String(currentMessages[0].id))
        } else {
          handleNextMessage()
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault()
        handlePrevMessage()
      } else if (e.key === 'x') {
        // Toggle selection for current item
        if (currentSelectedId) {
          e.preventDefault()
          const isSelected = !!currentRowSelection[currentSelectedId]
          setRowSelection(prev => {
            const newSelection = { ...prev }
            if (isSelected) {
              delete newSelection[currentSelectedId]
            } else {
              newSelection[currentSelectedId] = true
            }
            return newSelection
          })
        }
      } else if (e.key === 'Escape') {
        handleClosePanel()
      } else if (e.key === ']' && e.shiftKey) { // Shift+] to toggle layout
        setLayoutMode(prev => prev === 'list' ? 'split' : 'list')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNextMessage, handlePrevMessage])

  // Topics options
  const topicOptions = useMemo(() => {
    if (!topicsData) return []
    return topicsData.map((topic: { id?: string | number; name?: string; title?: string }) => ({
      label: topic.name || topic.title || 'Unknown',
      value: topic.id || topic.name,
    }))
  }, [topicsData])


  return (
    <PageWrapper className="h-[calc(100vh-56px-2rem)] overflow-hidden flex flex-col gap-4">
      {/* Header Area */}
      <div className="flex flex-col gap-4 flex-shrink-0">
        <MessagesSummaryHeader stats={signalNoiseStats} totalMessages={totalMessages} />

        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0 overflow-x-auto flex items-center gap-2">
            <DataTableToolbar
              table={table as never}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
              searchPlaceholder={t('filters.searchPlaceholder', 'Введіть текст для пошуку...')}
              showColumnVisibility={false}
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

          <Tabs value={layoutMode} onValueChange={(v) => setLayoutMode(v as LayoutMode)}>
            <TabsList>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-2" />
                {t('layout.list')}
              </TabsTrigger>
              <TabsTrigger value="split">
                <Columns className="h-4 w-4 mr-2" />
                {t('layout.split')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content Area - Grid Layout */}
      <div className="flex-1 min-h-0 relative rounded-md border bg-card shadow-sm overflow-hidden">
        <div
          className={`
                h-full grid transition-all duration-300 ease-in-out divide-x
                ${layoutMode === 'split' ? 'grid-cols-1 lg:grid-cols-[480px_1fr]' : 'grid-cols-1'}
            `}
        >
          {/* Left Pane - Message List */}
          <div className={`h-full flex-col overflow-hidden ${layoutMode === 'split' ? 'hidden lg:flex' : 'flex'}`}>
            <div className="px-2 pt-2 shrink-0">
              <SmartBatchBanner messages={messages} />
            </div>

            {/* Sticky Date Header - outside overflow for glass effect (Firefox compat) */}
            {visibleDate && (
              <div className="shrink-0 bg-background/60 backdrop-blur-md shadow-sm py-2 px-4 border-b border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                <Calendar className="w-3 h-3 opacity-70" />
                {visibleDate}
              </div>
            )}

            {/* Scrollable message list */}
            <div className="flex-1 min-h-0 h-full">
              <MessageList
                messages={messages}
                isLoading={isLoading}
                selectedId={selectedMessageId}
                selectedIds={rowSelection}
                onSelect={handleMessageSelect}
                onToggleSelect={(id, checked) => setRowSelection(prev => ({ ...prev, [id]: checked }))}
                onCreateAtom={handleCreateAtom}
                onDismiss={handleDismiss}
                onPrefetch={prefetchMessageInspect}
                isError={isError}
                error={error as Error}
                hasMore={hasNextPage}
                onLoadMore={fetchNextPage}
                isFetchingNextPage={isFetchingNextPage}
                total={totalMessages}
                onVisibleDateChange={setVisibleDate}
              />
            </div>
          </div>

          {/* Right Pane - Detail Panel */}
          <div className={`h-full w-full overflow-hidden bg-background ${layoutMode === 'list' ? 'hidden' : 'flex'}`}>
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
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-fixed animate-in fade-in slide-in-from-bottom-4 duration-200">
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
                className="h-8 rounded-full hover:bg-accent/10 hover:text-accent-foreground px-3 text-muted-foreground transition-colors"
                onClick={() => {
                  // This should trigger the extraction dialog
                  setShowExtractionDialog(true)
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {t('actions.extract', 'Extract')}
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
              className="rounded-full text-muted-foreground hover:bg-muted"
              onClick={() => setRowSelection({})}
              aria-label={t('actions.clearSelection', 'Clear selection')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showExtractionDialog} onOpenChange={setShowExtractionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('extraction.fromSelectedMessages', 'Extract Knowledge from Selection')}</DialogTitle>
          </DialogHeader>
          <KnowledgeExtractionPanel
            messageIds={Object.keys(rowSelection).map(Number)}
            onComplete={() => {
              setShowExtractionDialog(false)
              setRowSelection({})
              queryClient.invalidateQueries({ queryKey: ['topics'] })
              queryClient.invalidateQueries({ queryKey: ['atoms'] })
            }}
          />
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}

export default MessagesPage
