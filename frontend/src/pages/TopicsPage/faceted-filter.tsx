import * as React from 'react'
import { CheckIcon, PlusCircleIcon } from '@heroicons/react/24/outline'

import { Button, Popover, PopoverTrigger, PopoverContent, Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, Badge, Separator } from '@/shared/ui'
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
  const selectedValues = new Set((column?.getFilterValue() as string[] | undefined) ?? [])

  // Precompute counts per option from faceted values
  const facets = column?.getFacetedUniqueValues()

  if (!column) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed border-border">
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge key={option.value} variant="secondary" className="rounded-sm px-1 font-normal">
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value)
                      } else {
                        selectedValues.add(option.value)
                      }
                      const filterValues = Array.from(selectedValues)
                      column.setFilterValue(filterValues.length ? filterValues : undefined)
                    }}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <CheckIcon />
                    </div>
                    {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                    <span>{option.label}</span>
                    {facets?.get(option.value) && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {facets.get(option.value)}
                      </span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
