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
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { cn } from '@/shared/lib/index'
import type { DataTableColumnMeta } from './types'

interface DataTableProps<TData> {
  table: TableType<TData>
  columns: ColumnDef<TData>[]
  emptyMessage?: string
  renderMobileCard?: (row: TData, index: number) => React.ReactNode
  onRowClick?: (row: TData) => void
  enableResizing?: boolean
}

export function DataTable<TData>({
  table,
  columns,
  emptyMessage,
  renderMobileCard,
  onRowClick,
  enableResizing = true,
}: DataTableProps<TData>) {
  const { t } = useTranslation('common')
  const isMobile = useIsMobile()

  const displayEmptyMessage = emptyMessage ?? t('dataTable.noResults')

  if (isMobile && renderMobileCard) {
    return (
      <div className="space-y-4">
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
            {displayEmptyMessage}
          </div>
        )}
      </div>
    )
  }

  // Check if resizing is enabled on the table
  const isResizingEnabled = enableResizing && table.options.enableColumnResizing

  // Calculate table width: use container width or column sum, whichever is larger
  const columnTotalSize = table.getCenterTotalSize()

  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-md border">
      <Table
        role="grid"
        aria-label="Data table"
        className="w-full"
        style={isResizingEnabled ? {
          minWidth: columnTotalSize,
          tableLayout: 'fixed',
        } : undefined}
      >
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined
                const canResize = isResizingEnabled && header.column.getCanResize()

                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      meta?.className,
                      canResize && 'relative select-none'
                    )}
                    style={isResizingEnabled ? { width: header.getSize() } : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}

                    {/* Resize handle */}
                    {canResize && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onDoubleClick={() => header.column.resetSize()}
                        className={cn(
                          'absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none',
                          'bg-transparent hover:bg-primary/30',
                          header.column.getIsResizing() && 'bg-primary'
                        )}
                        style={{
                          transform: header.column.getIsResizing()
                            ? `translateX(${table.getState().columnSizingInfo.deltaOffset}px)`
                            : undefined,
                        }}
                        aria-hidden="true"
                      />
                    )}
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
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && onRowClick) {
                    e.preventDefault()
                    onRowClick(row.original)
                  }
                }}
                tabIndex={onRowClick ? 0 : -1}
                className={onRowClick ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2' : undefined}
                role={onRowClick ? 'button' : undefined}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined
                  return (
                    <TableCell
                      key={cell.id}
                      className={meta?.className}
                      style={isResizingEnabled ? { width: cell.column.getSize() } : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {displayEmptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export type { DataTableColumnMeta } from './types'
