import React, { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Spinner } from '@/shared/ui'
import { apiClient } from '@/shared/lib/api/client'
import { Task } from '@/shared/types'
import { useTasksStore } from '@/features/tasks/store/tasksStore'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { columns as baseColumns, statusLabels, priorityLabels } from './columns'
import { DataTableFacetedFilter } from './faceted-filter'
import { DataTable } from '@/shared/components/DataTable'
import { DataTableToolbar } from '@/shared/components/DataTableToolbar'
import { DataTablePagination } from '@/shared/components/DataTablePagination'
import { Button } from '@/shared/ui'

// Normalize backend/legacy status values to our canonical set
const normalizeStatus = (s: string): Task['status'] => {
  const v = String(s || '').toLowerCase()
  if (v === 'cancelled' || v === 'canceled') return 'closed'
  if (v === 'in-progress' || v === 'inprogress') return 'in_progress'
  if (v === 'done' || v === 'complete' || v === 'completed') return 'completed'
  if (v === 'todo' || v === 'backlog' || v === 'open') return 'open'
  if (v === 'pending') return 'pending'
  if (v === 'closed') return 'closed'
  return (v as Task['status'])
}

const normalizePriority = (p: string): Task['priority'] => {
  const v = String(p || '').toLowerCase()
  if (v === 'normal') return 'medium'
  if (v === 'urgent' || v === 'critical' || v === 'high' || v === 'medium' || v === 'low') return v as Task['priority']
  return 'medium'
}

const TopicsPage = () => {
  const { setTasks } = useTasksStore()

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await apiClient.get('/api/tasks')
      return response.data
    },
  })
  

  useEffect(() => {
    if (tasks) {
      setTasks(tasks)
    }
  }, [tasks, setTasks])

  // Data table state
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  const normalizedTasks = React.useMemo(() => {
    return (tasks ?? []).map((t) => ({
      ...t,
      status: normalizeStatus((t as any).status),
      priority: normalizePriority((t as any).priority),
    }))
  }, [tasks])

  const table = useReactTable({
    data: normalizedTasks,
    columns: baseColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).toLowerCase()
      return (
        String(row.original.title).toLowerCase().includes(q) ||
        String(row.original.description || '').toLowerCase().includes(q)
      )
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        searchPlaceholder="Filter tasks..."
      >
        <DataTableFacetedFilter
          columnKey="status"
          table={table}
          title="Status"
          options={Object.entries(statusLabels).map(([value, meta]) => ({ value, label: meta.label, icon: meta.icon }))}
        />
        <DataTableFacetedFilter
          columnKey="priority"
          table={table}
          title="Priority"
          options={Object.entries(priorityLabels).map(([value, meta]) => ({ value, label: meta.label }))}
        />
        {(table.getColumn('status')?.getFilterValue() as string[] | undefined)?.length ||
         (table.getColumn('priority')?.getFilterValue() as string[] | undefined)?.length ||
         sorting.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => {
            table.resetColumnFilters()
            setSorting([])
          }}>
            Reset
          </Button>
        ) : null}
      </DataTableToolbar>

      <DataTable table={table} columns={baseColumns} emptyMessage="No tasks found." />

      <DataTablePagination table={table} />
    </div>
  )
}

export default TopicsPage