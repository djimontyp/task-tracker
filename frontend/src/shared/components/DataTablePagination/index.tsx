import React from 'react'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Button,
  Input,
} from '@/shared/ui'
import { ChevronRight, ChevronsRight } from 'lucide-react'
import { Table as TableType } from '@tanstack/react-table'

interface DataTablePaginationProps<TData> {
  table: TableType<TData>
  pageSizeOptions?: number[]
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 25, 50],
}: DataTablePaginationProps<TData>) {
  const [pageInput, setPageInput] = React.useState('')
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()
  const canNext = table.getCanNextPage()

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value)
  }

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const page = parseInt(pageInput, 10)
    if (page >= 1 && page <= totalPages) {
      table.setPageIndex(page - 1)
      setPageInput('')
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2 py-4 w-full max-w-full overflow-x-hidden">
      <div className="flex-1 text-sm text-muted-foreground w-full sm:w-auto">
        {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:gap-4 lg:gap-6 w-full sm:w-auto">
        <div className="hidden sm:flex items-center gap-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium hidden sm:inline">Page</span>
          <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2 sm:gap-2">
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={handlePageInputChange}
              placeholder={String(currentPage)}
              className="h-8 w-12 sm:w-16 text-center"
              aria-label="Go to page"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">of {totalPages}</span>
          </form>
        </div>
        <div className="flex items-center gap-2 sm:gap-2">
          {canNext && (
            <Button
              variant="outline"
              className="h-11 w-11 p-0 flex-shrink-0"
              onClick={() => table.nextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {canNext && (
            <Button
              variant="outline"
              className="hidden lg:flex h-11 w-11 p-0 flex-shrink-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
