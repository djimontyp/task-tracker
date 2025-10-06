import React, { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Spinner,
  Button,
  Input,
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
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@shared/ui'
import { apiClient } from '@shared/lib/api/client'
import { Task } from '@shared/types'
import { useTasksStore } from '@features/tasks/store/tasksStore'
import { toast } from 'sonner'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
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
import { ChevronDown } from 'lucide-react'

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

const TasksPage = () => {
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex w-full items-center gap-2 flex-wrap">
          <Input
            placeholder="Filter tasks..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
            aria-label="Filter tasks"
          />
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
           (table.getColumn('priority')?.getFilterValue() as string[] | undefined)?.length ? (
            <Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()}>
              Reset
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4">
                <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Button>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              View <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {table
              .getAllColumns()
              .filter((c) => c.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table role="grid" aria-label="Tasks table">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
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
                <TableCell colSpan={baseColumns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2 py-2">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select value={String(table.getState().pagination.pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
            <SelectTrigger className="h-8 w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => table.previousPage()} aria-disabled={!table.getCanPreviousPage()} />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext onClick={() => table.nextPage()} aria-disabled={!table.getCanNextPage()} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

export default TasksPage