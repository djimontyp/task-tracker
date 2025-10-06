import * as React from 'react'
import { Check, PlusCircle, ChevronDown } from 'lucide-react'

import { Button, Popover, PopoverTrigger, PopoverContent, Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, Badge, Checkbox } from '@/shared/ui'
import { cn } from '@/shared/lib'
import type { Table } from '@tanstack/react-table'

export type FacetOption = {
  value: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface DataTableFacetedFilterProps<TData> {
  columnKey: string
  title: string
  table: Table<TData>
  options: FacetOption[]
}

export function DataTableFacetedFilter<TData>({ columnKey, table, title, options }: DataTableFacetedFilterProps<TData>) {
  const column = table.getColumn(columnKey)
  const isFiltered = (column?.getFilterValue() as string[] | undefined)?.length

  // Precompute counts per option from prefiltered rows
  const counts = React.useMemo(() => {
    const rows = table.getPreFilteredRowModel().flatRows
    const map = new Map<string, number>()
    for (const row of rows) {
      const v = String(row.getValue(columnKey) ?? '')
      map.set(v, (map.get(v) ?? 0) + 1)
    }
    return map
  }, [table, columnKey])

  if (!column) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-8', isFiltered ? 'border-primary text-primary' : '')}>
          <PlusCircle className="mr-2 h-4 w-4" /> {title}
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const selected = (column.getFilterValue() as string[] | undefined)?.includes(opt.value)
                const Icon = opt.icon
                const count = counts.get(opt.value) ?? 0
                return (
                  <CommandItem
                    key={opt.value}
                    onSelect={() => {
                      const current = (column.getFilterValue() as string[] | undefined) ?? []
                      const next = selected ? current.filter((v) => v !== opt.value) : [...current, opt.value]
                      column.setFilterValue(next.length ? next : undefined)
                    }}
                    className="flex items-center gap-2"
                  >
                    <Checkbox checked={!!selected} onCheckedChange={() => {}} aria-hidden className="pointer-events-none" />
                    {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
                    <span className="flex-1 text-sm">{opt.label}</span>
                    <Badge variant="secondary" className="ml-2 rounded-sm px-1.5 py-0 text-[10px]">{count}</Badge>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
          {isFiltered ? (
            <div className="border-t p-2">
              <Button
                onClick={() => column.setFilterValue(undefined)}
                variant="ghost"
                size="sm"
                className="h-8 w-full justify-start text-muted-foreground"
              >
                <Check className="mr-2 h-4 w-4" /> Clear filters
              </Button>
            </div>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
