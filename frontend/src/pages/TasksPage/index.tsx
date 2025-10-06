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
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { columns as baseColumns, statusLabels, priorityLabels } from './columns'
import { DataTableFacetedFilter } from './faceted-filter'
import { ChevronDown } from 'lucide-react'

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

  const table = useReactTable({
    data: tasks ?? [],
    columns: baseColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
          {/* Active filter chips */}
          {((table.getColumn('status')?.getFilterValue() as string[] | undefined) ?? []).map((v) => (
            <Button key={`status-${v}`} variant="secondary" size="sm" className="h-8 rounded-full"
              onClick={() => {
                const col = table.getColumn('status')
                const current = (col?.getFilterValue() as string[] | undefined) ?? []
                col?.setFilterValue(current.filter((x) => x !== v))
              }}
            >
              {statusLabels[v]?.label ?? v} ×
            </Button>
          ))}
          {((table.getColumn('priority')?.getFilterValue() as string[] | undefined) ?? []).map((v) => (
            <Button key={`priority-${v}`} variant="secondary" size="sm" className="h-8 rounded-full"
              onClick={() => {
                const col = table.getColumn('priority')
                const current = (col?.getFilterValue() as string[] | undefined) ?? []
                col?.setFilterValue(current.filter((x) => x !== v))
              }}
            >
              {priorityLabels[v]?.label ?? v} ×
            </Button>
          ))}

          <Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()} className="ml-1">
            Reset
          </Button>
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