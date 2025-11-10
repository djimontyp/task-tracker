import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import {
  ColumnDef,
  flexRender,
  Table as TableType,
} from '@tanstack/react-table'
import { useIsMobile } from '@/shared/hooks/use-mobile'

interface DataTableProps<TData> {
  table: TableType<TData>
  columns: ColumnDef<TData>[]
  emptyMessage?: string
  renderMobileCard?: (row: TData, index: number) => React.ReactNode
  onRowClick?: (row: TData) => void
}

export function DataTable<TData>({
  table,
  columns,
  emptyMessage = 'No results.',
  renderMobileCard,
  onRowClick,
}: DataTableProps<TData>) {
  const isMobile = useIsMobile()

  if (isMobile && renderMobileCard) {
    return (
      <div className="space-y-3">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row, index) => (
            <div
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className={onRowClick ? 'cursor-pointer' : undefined}
            >
              {renderMobileCard(row.original, index)}
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-24 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-md border max-w-full">
      <Table role="grid" aria-label="Data table" className="min-w-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta as { className?: string } | undefined
                return (
                  <TableHead key={header.id} className={meta?.className}>
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
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                onClick={() => onRowClick?.(row.original)}
                className={onRowClick ? 'cursor-pointer' : undefined}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as { className?: string } | undefined
                  return (
                    <TableCell key={cell.id} className={meta?.className}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
