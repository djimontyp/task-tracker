import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  Button,
  Card,
  Skeleton,
} from '@/shared/ui'
import { EmptyState } from '@/shared/patterns'
import { PageWrapper } from '@/shared/primitives'
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import { atomService } from '@/features/atoms/api/atomService'
import { toast } from 'sonner'
import { logger } from '@/shared/utils/logger'
import { useWebSocket } from '@/shared/hooks'
import {
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  ColumnSizingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table'
import { createColumns, getSourceLabels } from './columns'
import { getMessageAnalysisBadge, getNoiseClassificationBadge } from '@/shared/utils/statusBadges'
import { useScoringConfig } from '@/shared/api/scoringConfig'
import { Message, NoiseClassification } from '@/shared/types'
import { DataTable } from '@/shared/components/DataTable'
import { DataTableToolbar } from '@/shared/components/DataTableToolbar'
import { DataTablePagination } from '@/shared/components/DataTablePagination'
import { DataTableFacetedFilter } from '@/shared/components/DataTableFacetedFilter'
import { ImportanceScoreFilter } from './importance-score-filter'
import { BulkActionsToolbar } from '@/shared/components/AdminPanel/BulkActionsToolbar'
import { useMultiSelect } from '@/shared/hooks'
import { useAdminMode } from '@/shared/hooks/useAdminMode'
import { Download, RotateCw, User, Coffee, LayoutGrid, List } from 'lucide-react'
import { IngestionModal } from './IngestionModal'
import { SmartFilters } from './SmartFilters'
import { useFilterParams, type FilterMode } from './useFilterParams'
import { MessageInspectModal } from '@/features/messages/components/MessageInspectModal'
import { ConsumerMessageModal } from '@/features/messages/components/ConsumerMessageModal'
import { MessageCard } from './MessageCard'
import { MessagesSummaryHeader } from './MessagesSummaryHeader'

interface MessageQueryParams {
  page: number
  page_size: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

interface PaginatedResponse {
  items: Message[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

const MessagesPage = () => {
  const { t } = useTranslation('messages')
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)
  const [inspectingMessageId, setInspectingMessageId] = useState<string | null>(null)
  const [viewingMessageId, setViewingMessageId] = useState<string | null>(null)
  const { isAdminMode } = useAdminMode()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Fetch scoring config for dynamic thresholds
  const { data: scoringConfig } = useScoringConfig()


  // URL param for highlighting message from search
  const highlightMessageId = searchParams.get('highlight')

  // Smart Filters: URL-synced filter mode
  const { filterMode, setFilterMode } = useFilterParams()

  // Data table state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'sent_at', desc: true }
  ])
  // Initialize with column filters based on filterMode
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    id: false,
    sent_at: false,
  })
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  const { data: paginatedData, isLoading, refetch } = useQuery<PaginatedResponse>({
    queryKey: ['messages', currentPage, pageSize, sorting],
    queryFn: async () => {
      try {
        const params: MessageQueryParams = {
          page: currentPage,
          page_size: pageSize
        }

        if (sorting.length > 0) {
          const sort = sorting[0]
          params.sort_by = sort.id
          params.sort_order = sort.desc ? 'desc' : 'asc'
        }

        const response = await apiClient.get(API_ENDPOINTS.messages, { params })
        return response.data
      } catch {
        logger.warn('Messages endpoint not available yet, returning empty response')
        return { items: [], total: 0, page: 1, page_size: pageSize, total_pages: 1 }
      }
    },
  })

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
    _reconnect: true,
  })

  // Handle highlight param from search navigation
  const [viewMode, setViewMode] = useState<'feed' | 'table'>('feed')

  // Handle highlight param from search navigation
  useEffect(() => {
    if (highlightMessageId) {
      // Open the message modal for the highlighted message
      if (isAdminMode) {
        setInspectingMessageId(highlightMessageId)
      } else {
        setViewingMessageId(highlightMessageId)
      }
      // Clear the highlight param from URL
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('highlight')
      setSearchParams(newParams, { replace: true })
    }
  }, [highlightMessageId, isAdminMode, searchParams, setSearchParams])


  const hasActiveFilters = React.useMemo(() => {
    // Check if there are column filters
    if (columnFilters.length > 0) return true

    // Check if sorting is different from default (sent_at desc)
    if (sorting.length === 0) return false
    if (sorting.length > 1) return true
    const sort = sorting[0]
    return sort.id !== 'sent_at' || sort.desc !== true
  }, [columnFilters, sorting])

  const handleReset = useCallback(() => {
    setColumnFilters([])
    setSorting([{ id: 'sent_at', desc: true }])
  }, [])

  // Use ref to store checkbox click handler to avoid columns recreation
  const checkboxClickHandlerRef = React.useRef<((rowId: string, event: React.MouseEvent) => void) | undefined>(undefined)

  // Stable callback that delegates to ref
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
    data: paginatedData?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true, // Server-side pagination
    manualSorting: true, // Server-side sorting
    pageCount: paginatedData?.total_pages || 1,
    // Column resizing
    enableColumnResizing: true,
    columnResizeMode: 'onEnd', // More performant - updates on mouse release
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function'
        ? updater({ pageIndex: currentPage - 1, pageSize })
        : updater

      // If pageSize changed, reset to first page
      if (newPagination.pageSize !== pageSize) {
        setCurrentPage(1)
        setPageSize(newPagination.pageSize)
      } else {
        setCurrentPage(newPagination.pageIndex + 1)
      }
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnSizing,
      rowSelection,
      globalFilter,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: pageSize
      }
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).toLowerCase()
      return (
        String(row.original.author_name || '').toLowerCase().includes(q) ||
        String(row.original.content || '').toLowerCase().includes(q)
      )
    },
  })

  const multiSelect = useMultiSelect({
    table,
    onSelectionChange: (selectedIds) => {
      logger.debug('Selection changed:', selectedIds)
    },
  })

  React.useEffect(() => {
    checkboxClickHandlerRef.current = multiSelect.handleCheckboxClick
  }, [multiSelect.handleCheckboxClick])

  const handleIngestMessages = () => {
    logger.debug('Opening ingestion modal')
    setModalOpen(true)
  }

  const handleIngestionSuccess = (jobId: number) => {
    logger.info('Ingestion job started:', jobId)
    // TODO: Show progress tracking or redirect to jobs page
  }

  const handleRefreshMessages = async () => {
    try {
      await refetch()
      toast.success(t('common:toast.success.refreshed', { entity: t('common:toast.entities.messages') }))
    } catch {
      toast.error(t('common:toast.error.refreshFailed', { entity: t('common:toast.entities.messages') }))
    }
  }

  const handleUpdateAuthors = async () => {
    const chatId = prompt('Enter Telegram Chat ID (e.g., -1002988379206):')
    if (!chatId) return

    try {
      toast.loading(t('common:toast.info.updating', { entity: t('common:toast.entities.authors') }), { id: 'update-authors' })

      const response = await apiClient.post(`/api/messages/update-authors?chat_id=${chatId}`)

      if (response.data.success) {
        toast.success(
          t('common:toast.success.updated', { entity: t('common:toast.entities.authors') }),
          { id: 'update-authors' }
        )
        await refetch()
      } else {
        toast.error(response.data.message || t('common:toast.error.updateFailed', { entity: t('common:toast.entities.authors') }), { id: 'update-authors' })
      }
    } catch (updateError) {
      logger.error('Update authors error:', updateError)
      toast.error(t('common:toast.error.updateFailed', { entity: t('common:toast.entities.authors') }), { id: 'update-authors' })
    }
  }

  const selectedRowsCount = Object.keys(rowSelection).length

  // Calculate signal/noise counts for SmartFilters
  const signalNoiseStats = useMemo(() => {
    const items = paginatedData?.items ?? []
    const signalCount = items.filter(m => m.noise_classification === 'signal').length
    const noiseCount = items.filter(m => m.noise_classification === 'noise' || m.noise_classification === 'weak_signal').length
    const total = items.length
    const ratio = total > 0 ? Math.round((signalCount / total) * 100) : 0
    return { signalCount, noiseCount, total, ratio }
  }, [paginatedData?.items])

  // Sync filterMode with column filters
  useEffect(() => {
    if (filterMode === 'signals') {
      setColumnFilters([{ id: 'noise_classification', value: ['signal'] }])
    } else if (filterMode === 'noise') {
      setColumnFilters([{ id: 'noise_classification', value: ['noise', 'weak_signal'] }])
    } else {
      setColumnFilters([])
    }
  }, [filterMode])

  // Handle Smart Filter change
  const handleFilterChange = useCallback((mode: FilterMode) => {
    setFilterMode(mode)
  }, [setFilterMode])

  const handleBulkApprove = useCallback(async () => {
    const count = Object.keys(table.getState().rowSelection).length
    if (count === 0) return

    const selectedIds = table.getSelectedRowModel().rows.map(row => String(row.original.id))
    const toastId = toast.loading(t('common:toast.info.processing', { entity: t('common:toast.entities.messages') }))

    try {
      const { approved_count, failed_ids, errors } = await atomService.bulkApprove(selectedIds)

      if (failed_ids.length > 0) {
        toast.warning(
          t('common:toast.warning.partialSuccess', { action: t('common:toast.actions.approved'), successCount: approved_count, totalCount: count, entity: t('common:toast.entities.messages'), failedCount: failed_ids.length }),
          { id: toastId }
        )
        logger.warn('Bulk approve partial failure:', { failed_ids, errors })
      } else {
        toast.success(t('common:toast.success.approved', { count: approved_count, entity: t('common:toast.entities.messages') }), { id: toastId })
      }

      multiSelect.handleClearSelection()
      await refetch()
    } catch (approveError) {
      logger.error('Bulk approve error:', approveError)
      toast.error(t('common:toast.error.approveFailed', { entity: t('common:toast.entities.messages') }), { id: toastId })
    }
  }, [table, multiSelect, refetch, t])

  const handleBulkArchive = useCallback(async () => {
    const count = Object.keys(table.getState().rowSelection).length
    if (count === 0) return

    const selectedIds = table.getSelectedRowModel().rows.map(row => String(row.original.id))
    const toastId = toast.loading(t('common:toast.info.processing', { entity: t('common:toast.entities.messages') }))

    try {
      const { archived_count, failed_ids, errors } = await atomService.bulkArchive(selectedIds)

      if (failed_ids.length > 0) {
        toast.warning(
          t('common:toast.warning.partialSuccess', { action: t('common:toast.actions.archived'), successCount: archived_count, totalCount: count, entity: t('common:toast.entities.messages'), failedCount: failed_ids.length }),
          { id: toastId }
        )
        logger.warn('Bulk archive partial failure:', { failed_ids, errors })
      } else {
        toast.success(t('common:toast.success.archived', { count: archived_count, entity: t('common:toast.entities.messages') }), { id: toastId })
      }

      multiSelect.handleClearSelection()
      await refetch()
    } catch (archiveError) {
      logger.error('Bulk archive error:', archiveError)
      toast.error(t('common:toast.error.archiveFailed', { entity: t('common:toast.entities.messages') }), { id: toastId })
    }
  }, [table, multiSelect, refetch, t])

  const handleBulkDelete = useCallback(async () => {
    const count = Object.keys(table.getState().rowSelection).length
    if (count === 0) return

    const confirmed = window.confirm(`Delete ${count} selected messages?`)
    if (!confirmed) return

    const selectedIds = table.getSelectedRowModel().rows.map(row => String(row.original.id))
    const toastId = toast.loading(t('common:toast.info.processing', { entity: t('common:toast.entities.messages') }))

    try {
      const { deleted_count, failed_ids, errors } = await atomService.bulkDelete(selectedIds)

      if (failed_ids.length > 0) {
        toast.warning(
          t('common:toast.warning.partialSuccess', { action: t('common:toast.actions.deleted'), successCount: deleted_count, totalCount: count, entity: t('common:toast.entities.messages'), failedCount: failed_ids.length }),
          { id: toastId }
        )
        logger.warn('Bulk delete partial failure:', { failed_ids, errors })
      } else {
        toast.success(t('common:toast.success.deleted', { entity: t('common:toast.entities.message') }), { id: toastId })
      }

      multiSelect.handleClearSelection()
      await refetch()
    } catch (deleteError) {
      logger.error('Bulk delete error:', deleteError)
      toast.error(t('common:toast.error.deleteFailed', { entity: t('common:toast.entities.messages') }), { id: toastId })
    }
  }, [table, multiSelect, refetch, t])

  if (isLoading) {
    return (
      <PageWrapper variant="fullWidth">
        <div className="flex items-center justify-between" role="status" aria-label="Loading messages" aria-live="polite">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
        <Card className="overflow-hidden">
          <div className="p-4 space-y-4">
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-10 flex-1 max-w-xs" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="border rounded-md">
              <div className="border-b">
                <Skeleton className="h-12 w-full" />
              </div>
              {[...Array(10)].map((_, i) => (
                <div key={i} className="border-b last:border-b-0 p-4 flex gap-4">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-9 w-64" />
            </div>
          </div>
        </Card>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper variant="fullWidth" className="w-full min-w-0 overflow-x-hidden">
      {/* Humanized Summary Header */}
      <div className="mb-6">
        <MessagesSummaryHeader stats={signalNoiseStats} />
      </div>

      {/* Controls Row: Smart Filters + View Mode + Actions */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Smart Filters (replaces Signal Toggle + Badge) */}
        <SmartFilters
          counts={{
            all: paginatedData?.total ?? 0,
            signals: signalNoiseStats.signalCount,
            noise: signalNoiseStats.noiseCount,
          }}
          activeFilter={filterMode}
          onFilterChange={handleFilterChange}
        />

        <div className="flex-1" />

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 border-r pr-2 mr-2">
          <Button
            size="icon"
            variant={viewMode === 'feed' ? 'secondary' : 'ghost'}
            onClick={() => setViewMode('feed')}
            title={t('viewMode.feed')}
            aria-label={t('viewMode.feed')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            onClick={() => setViewMode('table')}
            title={t('viewMode.table')}
            aria-label={t('viewMode.table')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions toolbar */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleRefreshMessages} size="sm" variant="outline">
            <RotateCw className="mr-2 h-4 w-4" />
            {t('actions.refresh')}
          </Button>
          <Button onClick={handleUpdateAuthors} size="sm" variant="outline">
            <User className="mr-2 h-4 w-4" />
            {t('actions.updateAuthors')}
          </Button>
          <Button onClick={handleIngestMessages} size="sm">
            <Download className="mr-2 h-4 w-4" />
            {t('ingestion.title')}
          </Button>
        </div>
      </div>

      {selectedRowsCount > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedRowsCount}
          totalCount={paginatedData?.total || 0}
          onSelectAll={multiSelect.handleSelectAll}
          onClearSelection={multiSelect.handleClearSelection}
          onApprove={handleBulkApprove}
          onArchive={handleBulkArchive}
          onDelete={handleBulkDelete}
        />
      )}

      <div className="w-full min-w-0">
        <DataTableToolbar
          table={table}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          searchPlaceholder={t('filters.search')}
        >
          <DataTableFacetedFilter
            column={table.getColumn('source_name')}
            title={t('filters.source')}
            options={Object.entries(getSourceLabels(t)).map(([value, meta]) => ({
              value,
              label: meta.label,
              icon: meta.icon
            }))}
          />
          <DataTableFacetedFilter
            column={table.getColumn('analyzed')}
            title={t('filters.status')}
            options={[
              { value: 'analyzed', label: getMessageAnalysisBadge(true).label || 'Analyzed' },
              { value: 'pending', label: getMessageAnalysisBadge(false).label || 'Pending' },
            ]}
          />
          <DataTableFacetedFilter
            column={table.getColumn('noise_classification')}
            title={t('filters.classification')}
            options={(['signal', 'weak_signal', 'noise'] as NoiseClassification[]).map((value) => {
              const config = getNoiseClassificationBadge(value)
              return {
                value,
                label: config.label || value,
              }
            })}
          />
          <ImportanceScoreFilter
            column={table.getColumn('importance_score')}
            title={t('filters.importance')}
          />
        </DataTableToolbar>
      </div>

      <div className="w-full min-w-0">
        {viewMode === 'table' ? (
          (paginatedData?.items ?? []).length === 0 ? (
            <EmptyState
              icon={Coffee}
              title={t('list.empty')}
              description={t('list.emptyDescription')}
              action={
                <div className="flex flex-col items-center gap-2">
                  <Button onClick={handleIngestMessages}>
                    <Download className="mr-2 h-4 w-4" />
                    {t('ingestion.submit')}
                  </Button>
                  <span className="text-xs text-muted-foreground">{t('list.emptyHint')}</span>
                </div>
              }
            />
          ) : (
            <DataTable
              table={table}
              columns={columns}
              onRowClick={(message: Message) => {
                if (isAdminMode) {
                  setInspectingMessageId(String(message.id))
                } else {
                  setViewingMessageId(String(message.id))
                }
              }}
            />
          )
        ) : (
          <PageWrapper variant="centered" className="w-full min-w-0 !p-0 !space-y-4">
            {table.getRowModel().rows.length === 0 ? (
              <EmptyState
                variant="compact"
                icon={Coffee}
                title={t('list.empty')}
                description={t('list.emptyDescription')}
                action={
                  <div className="flex flex-col items-center gap-2">
                    <Button onClick={handleIngestMessages} size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      {t('ingestion.submit')}
                    </Button>
                    <span className="text-xs text-muted-foreground">{t('list.emptyHint')}</span>
                  </div>
                }
              />
            ) : (
              table.getRowModel().rows.map((row) => (
                <MessageCard
                  key={row.original.id}
                  message={row.original}
                  isSelected={row.getIsSelected()}
                  onSelect={(checked) => row.toggleSelected(!!checked)}
                  onClick={() => {
                    if (isAdminMode) {
                      setInspectingMessageId(String(row.original.id))
                    } else {
                      setViewingMessageId(String(row.original.id))
                    }
                  }}
                />
              ))
            )}
          </PageWrapper>
        )}
      </div>

      <div className="w-full min-w-0">
        <DataTablePagination table={table} />
      </div>

      <IngestionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleIngestionSuccess}
      />

      {inspectingMessageId && (
        <MessageInspectModal
          messageId={inspectingMessageId}
          onClose={() => setInspectingMessageId(null)}
        />
      )}

      {viewingMessageId && (
        <ConsumerMessageModal
          messageId={viewingMessageId}
          onClose={() => setViewingMessageId(null)}
        />
      )}
    </PageWrapper>
  )
}

export default MessagesPage
