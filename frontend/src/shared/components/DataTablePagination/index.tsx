import React from 'react'
import {
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
import { Table as TableType } from '@tanstack/react-table'

interface DataTablePaginationProps<TData> {
  table: TableType<TData>
  pageSizeOptions?: number[]
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 25, 50],
}: DataTablePaginationProps<TData>) {
  return (
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
            {pageSizeOptions.map((n) => (
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
  )
}
