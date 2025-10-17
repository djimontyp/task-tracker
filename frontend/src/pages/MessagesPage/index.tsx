import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Spinner,
  Button,
} from '@/shared/ui'
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
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
import { createColumns, sourceLabels, statusLabels, classificationLabels } from './columns'
import { Message, NoiseClassification } from '@/shared/types'
import { DataTable } from '@/shared/components/DataTable'
import { DataTableToolbar } from '@/shared/components/DataTableToolbar'
import { DataTablePagination } from '@/shared/components/DataTablePagination'
import { DataTableFacetedFilter } from './faceted-filter'
import { ImportanceScoreFilter } from './importance-score-filter'
import { ArrowDownTrayIcon, ArrowPathIcon, UserIcon } from '@heroicons/react/24/outline'
import { IngestionModal } from './IngestionModal'

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
    { id: 'sent_at', desc: true } // Default sort by sent_at descending
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
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

  const handleReset = React.useCallback(() => {
    setColumnFilters([])
    setSorting([{ id: 'sent_at', desc: true }])
  }, [])

  const columns = React.useMemo(
    () => createColumns({ onReset: handleReset, hasActiveFilters }),
    [hasActiveFilters, handleReset]
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
        <div className="flex gap-2">
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
        </div>
      </div>

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
          options={Object.entries(statusLabels).map(([value, meta]) => ({
            value,
            label: meta.label
          }))}
        />
        <DataTableFacetedFilter
          columnKey="noise_classification"
          table={table}
          title="Classification"
          options={Object.entries(classificationLabels).map(([value, meta]) => ({
            value: value as NoiseClassification,
            label: meta.label
          }))}
        />
        <ImportanceScoreFilter
          column={table.getColumn('importance_score')}
          title="Importance"
        />
      </DataTableToolbar>

      <DataTable table={table} columns={columns} emptyMessage="No messages found." />

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
