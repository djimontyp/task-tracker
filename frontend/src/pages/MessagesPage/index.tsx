import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Spinner,
  Button,
} from '@shared/ui'
import { apiClient } from '@shared/lib/api/client'
import { toast } from 'sonner'
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
import { columns as baseColumns, sourceLabels, statusLabels, Message } from './columns'
import { DataTable } from '@shared/components/DataTable'
import { DataTableToolbar } from '@shared/components/DataTableToolbar'
import { DataTablePagination } from '@shared/components/DataTablePagination'
import { DataTableFacetedFilter } from './faceted-filter'
import { Download, RefreshCw, UserCheck } from 'lucide-react'
import { IngestionModal } from './IngestionModal'

interface PaginatedResponse {
  items: Message[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

const MessagesPage = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50)

  // Data table state
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  const { data: paginatedData, isLoading, refetch } = useQuery<PaginatedResponse>({
    queryKey: ['messages', currentPage, pageSize],
    queryFn: async () => {
      try {
        const params: any = {
          page: currentPage,
          page_size: pageSize
        }

        const response = await apiClient.get('/api/messages', { params })
        return response.data
      } catch (error) {
        console.warn('Messages endpoint not available yet, returning empty response')
        return { items: [], total: 0, page: 1, page_size: pageSize, total_pages: 1 }
      }
    },
  })


  const table = useReactTable({
    data: paginatedData?.items ?? [],
    columns: baseColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true, // Server-side pagination
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
      setCurrentPage(newPagination.pageIndex + 1)
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
        String(row.original.author || '').toLowerCase().includes(q) ||
        String(row.original.content || '').toLowerCase().includes(q)
      )
    },
  })

  const handleIngestMessages = () => {
    console.log('Opening ingestion modal')
    setModalOpen(true)
  }

  const handleIngestionSuccess = (jobId: number) => {
    console.log('Ingestion job started:', jobId)
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
      console.error('Update authors error:', error)
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
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleUpdateAuthors} size="sm" variant="outline">
            <UserCheck className="mr-2 h-4 w-4" />
            Update Authors
          </Button>
          <Button onClick={handleIngestMessages} size="sm">
            <Download className="mr-2 h-4 w-4" />
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
        {(table.getColumn('source_name')?.getFilterValue() as string[] | undefined)?.length ||
         (table.getColumn('analyzed')?.getFilterValue() as string[] | undefined)?.length ? (
          <Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()}>
            Reset
          </Button>
        ) : null}
      </DataTableToolbar>

      <DataTable table={table} columns={baseColumns} emptyMessage="No messages found." />

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
