import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Spinner,
  Button,
  Input,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/ui'
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { createColumns, statusConfig, type AnalysisRun } from './columns'
import { DataTableFacetedFilter } from './faceted-filter'
import { ChevronDown, Plus } from 'lucide-react'
import { CreateRunModal } from '@/features/analysis/components'
import { analysisService } from '@/features/analysis/api/analysisService'
import toast from 'react-hot-toast'
import type { AnalysisRunListResponse } from '@/features/analysis/types'

const AnalysisRunsPage = () => {
  const queryClient = useQueryClient()
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const { data, isLoading, error } = useQuery<AnalysisRunListResponse>({
    queryKey: ['analysis-runs'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.analysis.runs)
      return response.data as AnalysisRunListResponse
    },
  })

  const runs = data?.items ?? []
  const totalItems = data?.total ?? runs.length

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
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  // Create columns with action handlers
  const columns = createColumns({
    onStartRun: (runId) => startRunMutation.mutate(runId),
    onCloseRun: (runId) => closeRunMutation.mutate(runId),
  })

  const table = useReactTable({
    data: runs,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
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
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Analysis Runs</h1>
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
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analysis Runs</h1>
          <p className="text-muted-foreground">
            Manage and review AI-powered message analysis runs
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Run
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search runs..."
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(String(e.target.value))}
          className="max-w-sm"
        />

        {table.getColumn('status') && (
          <DataTableFacetedFilter
            column={table.getColumn('status')}
            title="Status"
            options={Object.entries(statusConfig).map(([value, config]) => ({
              label: config.label,
              value,
              icon: config.icon,
            }))}
          />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} style={{ width: header.getSize() }}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No analysis runs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4 py-4">
          <div className="text-sm text-muted-foreground">
            {totalItems} run(s) total
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <CreateRunModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  )
}

export default AnalysisRunsPage
