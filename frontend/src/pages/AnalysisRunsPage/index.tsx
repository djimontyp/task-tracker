import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Spinner,
  Button,
} from '@/shared/ui'
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from '@tanstack/react-table'
import { createColumns, statusConfig, triggerTypeLabels } from './columns'
import { DataTableFacetedFilter } from './faceted-filter'
import { PlusIcon } from '@heroicons/react/24/outline'
import { CreateRunModal } from '@/features/analysis/components'
import { analysisService } from '@/features/analysis/api/analysisService'
import { toast } from 'sonner'
import { DataTable } from '@/shared/components/DataTable'
import { DataTableToolbar } from '@/shared/components/DataTableToolbar'
import { DataTablePagination } from '@/shared/components/DataTablePagination'
import type { AnalysisRun } from '@/features/analysis/types'

const AnalysisRunsPage = () => {
  const queryClient = useQueryClient()
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const { data, isLoading, error } = useQuery<AnalysisRun[]>({
    queryKey: ['analysis-runs'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.analysis.runs)
      // Backend returns {items: [...]} not a plain array
      return response.data.items as AnalysisRun[]
    },
  })

  const runs = data ?? []

  // WebSocket integration for real-time updates
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost/ws'
    const ws = new WebSocket(`${wsUrl}?topics=analysis,proposals`)

    ws.onopen = () => {
      console.log('WebSocket connected for analysis updates')
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        if (message.topic === 'analysis') {
          switch (message.event) {
            case 'run_created':
              queryClient.invalidateQueries({ queryKey: ['analysis-runs'] })
              toast.success('New analysis run created')
              break
            case 'run_progress':
              queryClient.invalidateQueries({ queryKey: ['analysis-runs'] })
              break
            case 'run_completed':
              queryClient.invalidateQueries({ queryKey: ['analysis-runs'] })
              toast.success('Analysis run completed')
              break
            case 'run_failed':
              queryClient.invalidateQueries({ queryKey: ['analysis-runs'] })
              toast.error('Analysis run failed')
              break
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }

    return () => {
      ws.close()
    }
  }, [queryClient])

  // Mutations
  const startRunMutation = useMutation({
    mutationFn: (runId: string) => analysisService.startRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-runs'] })
      toast.success('Analysis run started')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start analysis run')
    },
  })

  const closeRunMutation = useMutation({
    mutationFn: (runId: string) => analysisService.closeRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-runs'] })
      toast.success('Analysis run closed')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to close analysis run')
    },
  })

  // Data table state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'created_at', desc: true }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  const hasActiveFilters = React.useMemo(() => {
    // Check if there are column filters
    if (columnFilters.length > 0) return true

    // Check if sorting is different from default (created_at desc)
    if (sorting.length === 0) return false
    if (sorting.length > 1) return true
    const sort = sorting[0]
    return sort.id !== 'created_at' || sort.desc !== true
  }, [columnFilters, sorting])

  const handleReset = React.useCallback(() => {
    setColumnFilters([])
    setSorting([{ id: 'created_at', desc: true }])
  }, [])

  // Create columns with action handlers
  const columns = React.useMemo(
    () => createColumns({
      onStartRun: (runId) => startRunMutation.mutate(runId),
      onCloseRun: (runId) => closeRunMutation.mutate(runId),
      onReset: handleReset,
      hasActiveFilters,
    }),
    [startRunMutation, closeRunMutation, hasActiveFilters, handleReset]
  )

  const table = useReactTable({
    data: runs,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: false, // Client-side pagination
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: { pageSize: 10 },
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="text-2xl font-bold tracking-tight">Analysis Runs</h2>
        <div className="p-6 border border-destructive rounded-md">
          <div className="flex items-start gap-3">
            <div className="text-destructive text-lg">⚠️</div>
            <div>
              <p className="font-semibold text-destructive mb-1">Error loading data</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Analysis Runs</h2>
        <div className="flex gap-2">
          <Button onClick={() => setCreateModalOpen(true)} size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Run
          </Button>
        </div>
      </div>

      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        searchPlaceholder="Search runs..."
      >
        <DataTableFacetedFilter
          columnKey="status"
          table={table}
          title="Status"
          options={Object.entries(statusConfig).map(([value, config]) => ({
            value,
            label: config.label,
            icon: config.icon,
          }))}
        />
        <DataTableFacetedFilter
          columnKey="trigger_type"
          table={table}
          title="Trigger Type"
          options={Object.entries(triggerTypeLabels).map(([value, meta]) => ({
            value,
            label: meta.label,
            icon: meta.icon,
          }))}
        />
      </DataTableToolbar>

      <DataTable table={table} columns={columns} emptyMessage="No analysis runs found." />

      <DataTablePagination table={table} />

      <CreateRunModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  )
}

export default AnalysisRunsPage
