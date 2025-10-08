import * as React from 'react'
import { Check, PlusCircle, ChevronDown } from 'lucide-react'
import type { Column } from '@tanstack/react-table'

import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  Badge,
  Checkbox,
} from '@/shared/ui'
import { cn } from '@/shared/lib'

export type FacetOption = {
  value: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title: string
  options: FacetOption[]
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues()
  const selectedValues = new Set(column?.getFilterValue() as string[])

  if (!column) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-8', selectedValues.size > 0 ? 'border-primary text-primary' : '')}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                {selectedValues.size}
              </Badge>
            </>
          )}
          <ChevronDown className="ml-1 h-4 w-4" />
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
                const Icon = option.icon
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
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined
                      )
                    }}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => {}}
                      aria-hidden
                      className="pointer-events-none"
                    />
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                    <span className="flex-1 text-sm">{option.label}</span>
                    {facets?.get(option.value) && (
                      <Badge
                        variant="secondary"
                        className="ml-2 rounded-sm px-1.5 py-0 text-[10px]"
                      >
                        {facets.get(option.value)}
                      </Badge>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
          {selectedValues.size > 0 && (
            <div className="border-t p-2">
              <Button
                onClick={() => column?.setFilterValue(undefined)}
                variant="ghost"
                size="sm"
                className="h-8 w-full justify-start text-muted-foreground"
              >
                <Check className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
