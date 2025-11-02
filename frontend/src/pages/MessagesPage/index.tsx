import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  Skeleton,
  Badge,
  Checkbox,
} from '@/shared/ui'
import { PageHeader } from '@/shared/components/PageHeader'
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS, API_BASE_PATH } from '@/shared/config/api'
import { toast } from 'sonner'
import { logger } from '@/shared/utils/logger'
import {
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table'
import { createColumns, sourceLabels } from './columns'
import { getMessageAnalysisBadge, getNoiseClassificationBadge, getImportanceBadge } from '@/shared/utils/statusBadges'
import { Message, NoiseClassification } from '@/shared/types'
import { DataTable } from '@/shared/components/DataTable'
import { DataTableToolbar } from '@/shared/components/DataTableToolbar'
import { DataTablePagination } from '@/shared/components/DataTablePagination'
import { DataTableFacetedFilter } from './faceted-filter'
import { ImportanceScoreFilter } from './importance-score-filter'
import { DataTableMobileCard } from '@/shared/components/DataTableMobileCard'
import { BulkActionsToolbar } from '@/shared/components/AdminPanel/BulkActionsToolbar'
import { useMultiSelect } from '@/shared/hooks'
import { ArrowDownTrayIcon, ArrowPathIcon, UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { IngestionModal } from './IngestionModal'
import { formatFullDate } from '@/shared/utils/date'

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
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Data table state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'sent_at', desc: true }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    id: false,
    sent_at: false,
  })
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768
      if (isMobile) {
        setColumnVisibility({
          id: false,
          sent_at: false,
          source_name: false,
          importance_score: false,
          noise_classification: false,
        })
      } else {
        setColumnVisibility({
          id: false,
          sent_at: false,
        })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
      } catch (error) {
        logger.warn('Messages endpoint not available yet, returning empty response')
        return { items: [], total: 0, page: 1, page_size: pageSize, total_pages: 1 }
      }
    },
  })

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost/ws'
    const ws = new WebSocket(`${wsUrl}?topics=noise_filtering`)

    ws.onopen = () => {
      console.log('[MessagesPage] WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        const { topic, event: eventType } = message

        if (topic === 'noise_filtering') {
          if (eventType === 'message_scored') {
            queryClient.invalidateQueries({ queryKey: ['messages'] })
          }

          if (eventType === 'batch_scored') {
            queryClient.invalidateQueries({ queryKey: ['messages'] })
          }
        }
      } catch (error) {
        console.error('[MessagesPage] Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('[MessagesPage] WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('[MessagesPage] WebSocket disconnected')
    }

    return () => {
      ws.close()
    }
  }, [queryClient])


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
      }),
    [hasActiveFilters, handleReset, handleCheckboxClick]
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
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
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

  // Update ref when multiSelect.handleCheckboxClick changes
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
      toast.success('Messages refreshed')
    } catch (error) {
      toast.error('Failed to refresh messages')
    }
  }

  const handleUpdateAuthors = async () => {
    const chatId = prompt('Enter Telegram Chat ID (e.g., -1002988379206):')
    if (!chatId) return

    try {
      toast.loading('Updating message authors...', { id: 'update-authors' })

      const response = await apiClient.post(`/api/messages/update-authors?chat_id=${chatId}`)

      if (response.data.success) {
        toast.success(
          `Updated ${response.data.updated} messages successfully!`,
          { id: 'update-authors' }
        )
        await refetch()
      } else {
        toast.error(response.data.message || 'Failed to update authors', { id: 'update-authors' })
      }
    } catch (error) {
      logger.error('Update authors error:', error)
      toast.error('Failed to update message authors', { id: 'update-authors' })
    }
  }

  const selectedRowsCount = Object.keys(rowSelection).length

  const handleBulkApprove = useCallback(async () => {
    const count = Object.keys(table.getState().rowSelection).length
    if (count === 0) return

    const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id)
    const toastId = toast.loading(`Approving ${count} messages...`)

    try {
      const response = await fetch(`${API_BASE_PATH}/atoms/bulk-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ atom_ids: selectedIds }),
      })

      if (!response.ok) {
        throw new Error(`Failed to approve messages: ${response.statusText}`)
      }

      const data = await response.json()
      const { approved_count, failed_ids = [], errors = [] } = data

      if (failed_ids.length > 0) {
        toast.warning(
          `Approved ${approved_count}/${count} messages. ${failed_ids.length} failed.`,
          { id: toastId }
        )
        logger.warn('Bulk approve partial failure:', { failed_ids, errors })
      } else {
        toast.success(`Approved ${approved_count} messages`, { id: toastId })
      }

      multiSelect.handleClearSelection()
      await refetch()
    } catch (error) {
      logger.error('Bulk approve error:', error)
      toast.error('Failed to approve messages', { id: toastId })
    }
  }, [table, multiSelect, refetch])

  const handleBulkArchive = useCallback(async () => {
    const count = Object.keys(table.getState().rowSelection).length
    if (count === 0) return

    const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id)
    const toastId = toast.loading(`Archiving ${count} messages...`)

    try {
      const response = await fetch(`${API_BASE_PATH}/atoms/bulk-archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ atom_ids: selectedIds }),
      })

      if (!response.ok) {
        throw new Error(`Failed to archive messages: ${response.statusText}`)
      }

      const data = await response.json()
      const { archived_count, failed_ids = [], errors = [] } = data

      if (failed_ids.length > 0) {
        toast.warning(
          `Archived ${archived_count}/${count} messages. ${failed_ids.length} failed.`,
          { id: toastId }
        )
        logger.warn('Bulk archive partial failure:', { failed_ids, errors })
      } else {
        toast.success(`Archived ${archived_count} messages`, { id: toastId })
      }

      multiSelect.handleClearSelection()
      await refetch()
    } catch (error) {
      logger.error('Bulk archive error:', error)
      toast.error('Failed to archive messages', { id: toastId })
    }
  }, [table, multiSelect, refetch])

  const handleBulkDelete = useCallback(async () => {
    const count = Object.keys(table.getState().rowSelection).length
    if (count === 0) return

    const confirmed = window.confirm(`Delete ${count} selected messages?`)
    if (!confirmed) return

    const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id)
    const toastId = toast.loading(`Deleting ${count} messages...`)

    try {
      const response = await fetch(`${API_BASE_PATH}/atoms/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ atom_ids: selectedIds }),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete messages: ${response.statusText}`)
      }

      const data = await response.json()
      const { deleted_count, failed_ids = [], errors = [] } = data

      if (failed_ids.length > 0) {
        toast.warning(
          `Deleted ${deleted_count}/${count} messages. ${failed_ids.length} failed.`,
          { id: toastId }
        )
        logger.warn('Bulk delete partial failure:', { failed_ids, errors })
      } else {
        toast.success(`Deleted ${deleted_count} messages`, { id: toastId })
      }

      multiSelect.handleClearSelection()
      await refetch()
    } catch (error) {
      logger.error('Bulk delete error:', error)
      toast.error('Failed to delete messages', { id: toastId })
    }
  }, [table, multiSelect, refetch])

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in" role="status" aria-label="Loading messages" aria-live="polite">
        <div className="flex items-center justify-between">
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
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Messages"
        description="View and manage all incoming messages with importance scores, noise filtering, and real-time updates from Telegram"
        actions={
          <>
            <Button onClick={handleRefreshMessages} size="sm" variant="outline">
              <ArrowPathIcon className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleUpdateAuthors} size="sm" variant="outline">
              <UserIcon className="mr-2 h-4 w-4" />
              Update Authors
            </Button>
            <Button onClick={handleIngestMessages} size="sm">
              <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
              Ingest Messages
            </Button>
          </>
        }
      />

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

      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        searchPlaceholder="Search messages..."
      >
        <DataTableFacetedFilter
          columnKey="source_name"
          table={table}
          title="Source"
          options={Object.entries(sourceLabels).map(([value, meta]) => ({
            value,
            label: meta.label,
            icon: meta.icon
          }))}
        />
        <DataTableFacetedFilter
          columnKey="analyzed"
          table={table}
          title="Status"
          options={[
            { value: 'analyzed', label: getMessageAnalysisBadge(true).label || 'Analyzed' },
            { value: 'pending', label: getMessageAnalysisBadge(false).label || 'Pending' },
          ]}
        />
        <DataTableFacetedFilter
          columnKey="noise_classification"
          table={table}
          title="Classification"
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
          title="Importance"
        />
      </DataTableToolbar>

      <DataTable
        table={table}
        columns={columns}
        emptyMessage="No messages found."
        renderMobileCard={(message: Message) => {
          const statusBadge = getMessageAnalysisBadge(message.analyzed || false)
          const importanceBadge = message.importance_score !== null && message.importance_score !== undefined
            ? getImportanceBadge(message.importance_score)
            : null
          const content = message.content || ''
          const isEmpty = !content || content.trim() === ''

          return (
            <DataTableMobileCard
              isSelected={table.getRow(String(message.id))?.getIsSelected() || false}
              onClick={() => table.getRow(String(message.id))?.toggleSelected()}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Checkbox
                      checked={table.getRow(String(message.id))?.getIsSelected() || false}
                      onCheckedChange={(checked) => {
                        table.getRow(String(message.id))?.toggleSelected(!!checked)
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      {message.avatar_url ? (
                        <img
                          src={message.avatar_url}
                          alt={message.author_name || message.author}
                          className="h-8 w-8 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium truncate">
                        {message.author_name || message.author}
                      </span>
                    </div>
                  </div>
                  <Badge variant={statusBadge.variant} className={statusBadge.className}>
                    {statusBadge.label}
                  </Badge>
                </div>

                <div>
                  {isEmpty ? (
                    <div className="flex items-center gap-2 text-muted-foreground/50 italic text-sm">
                      <EnvelopeIcon className="h-4 w-4" />
                      <span>(Empty message)</span>
                    </div>
                  ) : (
                    <p className="text-sm line-clamp-3">{content}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {importanceBadge && (
                    <Badge variant={importanceBadge.variant} className={importanceBadge.className}>
                      {importanceBadge.label}
                    </Badge>
                  )}
                  {message.topic_name && (
                    <Badge variant="outline">{message.topic_name}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {message.sent_at ? formatFullDate(message.sent_at) : '-'}
                  </span>
                </div>
              </div>
            </DataTableMobileCard>
          )
        }}
      />

      <DataTablePagination table={table} />

      <IngestionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleIngestionSuccess}
      />
    </div>
  )
}

export default MessagesPage
