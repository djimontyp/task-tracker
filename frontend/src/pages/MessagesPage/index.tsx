import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  Skeleton,
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
import { getMessageAnalysisBadge, getNoiseClassificationBadge } from '@/shared/utils/statusBadges'
import { Message, NoiseClassification } from '@/shared/types'
import { DataTable } from '@/shared/components/DataTable'
import { DataTableToolbar } from '@/shared/components/DataTableToolbar'
import { DataTablePagination } from '@/shared/components/DataTablePagination'
import { DataTableFacetedFilter } from './faceted-filter'
import { ImportanceScoreFilter } from './importance-score-filter'
import { BulkActionsToolbar } from '@/shared/components/AdminPanel/BulkActionsToolbar'
import { useMultiSelect } from '@/shared/hooks'
import { useAdminMode } from '@/shared/hooks/useAdminMode'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { ArrowDownTrayIcon, ArrowPathIcon, UserIcon } from '@heroicons/react/24/outline'
import { IngestionModal } from './IngestionModal'
import { MessageInspectModal } from '@/features/messages/components/MessageInspectModal'
import { ConsumerMessageModal } from '@/features/messages/components/ConsumerMessageModal'
import { MessageCard } from './MessageCard'

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
  const [inspectingMessageId, setInspectingMessageId] = useState<string | null>(null)
  const [viewingMessageId, setViewingMessageId] = useState<string | null>(null)
  const { isAdminMode } = useAdminMode()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const isDesktop = useMediaQuery('(min-width: 1280px)')

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
      logger.debug('[MessagesPage] WebSocket connected')
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
      logger.debug('[MessagesPage] WebSocket disconnected')
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
    <div className="space-y-4 animate-fade-in w-full min-w-0 overflow-x-hidden">
      <div className="w-full min-w-0">
        <PageHeader
          title="Messages"
          description="View and manage all incoming messages with importance scores, noise filtering, and real-time updates from Telegram"
          actions={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto min-w-0">
              <Button onClick={handleRefreshMessages} size="sm" variant="outline" className="w-full sm:w-auto justify-center">
                <ArrowPathIcon className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={handleUpdateAuthors} size="sm" variant="outline" className="w-full sm:w-auto justify-center">
                <UserIcon className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Update Authors</span>
                <span className="sm:hidden">Authors</span>
              </Button>
              <Button onClick={handleIngestMessages} size="sm" className="w-full sm:w-auto justify-center">
                <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Ingest Messages</span>
                <span className="sm:hidden">Ingest</span>
              </Button>
            </div>
          }
        />
      </div>

      <div className="min-h-[60px] w-full min-w-0">
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
      </div>

      <div className="w-full min-w-0">
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
      </div>

      <div className="w-full min-w-0">
        {isDesktop ? (
          <DataTable
            table={table}
            columns={columns}
            emptyMessage="No messages found."
            onRowClick={(message: Message) => {
              if (isAdminMode) {
                setInspectingMessageId(String(message.id))
              } else {
                setViewingMessageId(String(message.id))
              }
            }}
          />
        ) : (
          <div className="space-y-3 w-full min-w-0">
            {(paginatedData?.items ?? []).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No messages found.
              </div>
            ) : (
              (paginatedData?.items ?? []).map((message: Message) => {
                const isSelected = (rowSelection as Record<string, boolean>)[String(message.id)] || false

                return (
                  <MessageCard
                    key={message.id}
                    message={message}
                    isSelected={isSelected}
                    onSelect={(checked) => {
                      setRowSelection(prev => ({
                        ...prev,
                        [String(message.id)]: !!checked
                      }))
                    }}
                    onClick={() => {
                      if (isAdminMode) {
                        setInspectingMessageId(String(message.id))
                      } else {
                        setViewingMessageId(String(message.id))
                      }
                    }}
                  />
                )
              })
            )}
          </div>
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
    </div>
  )
}

export default MessagesPage
