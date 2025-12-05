import React from 'react'
import {
  Input,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  Checkbox,
} from '@/shared/ui'
import { ChevronDown } from 'lucide-react'
import { Table as TableType } from '@tanstack/react-table'

interface DataTableToolbarProps<TData> {
  table: TableType<TData>
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  searchPlaceholder?: string
  children?: React.ReactNode
}

export function DataTableToolbar<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  searchPlaceholder = 'Filter...',
  children,
}: DataTableToolbarProps<TData>) {
  const [open, setOpen] = React.useState(false)

  const hidableColumns = table
    .getAllColumns()
    .filter((column) => column.getCanHide())

  const visibleCount = hidableColumns.filter((col) => col.getIsVisible()).length

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full max-w-full overflow-x-hidden">
      <div className="flex w-full items-center gap-2 flex-wrap max-w-full overflow-x-hidden">
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className="max-w-sm"
          aria-label="Filter"
        />
        {children}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex-shrink-0">
            View
            {visibleCount < hidableColumns.length && (
              <span className="ml-2 rounded bg-muted px-2 text-xs">
                {visibleCount}/{hidableColumns.length}
              </span>
            )}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48 p-0">
          <Command>
            <CommandInput placeholder="Search columns..." />
            <CommandList>
              <CommandEmpty>No columns found.</CommandEmpty>
              {hidableColumns.map((column) => (
                <CommandItem
                  key={column.id}
                  onSelect={() => {
                    column.toggleVisibility(!column.getIsVisible())
                  }}
                  className="cursor-pointer"
                >
                  <Checkbox
                    checked={column.getIsVisible()}
                    className="mr-2"
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                  <span className="capitalize">{column.id.replace(/_/g, ' ')}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
