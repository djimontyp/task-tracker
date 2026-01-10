/**
 * MultiSelect - Multiple selection dropdown with search
 *
 * Uses Command + Popover pattern from shadcn/ui.
 * Supports keyboard navigation and search filtering.
 *
 * @example
 * <MultiSelect
 *   options={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2' },
 *   ]}
 *   value={['1']}
 *   onChange={(values) => setValues(values)}
 *   placeholder="Select options..."
 * />
 */

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Badge } from './badge'
import { Button } from './button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export interface MultiSelectOption {
  value: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface MultiSelectProps {
  /** Available options */
  options: MultiSelectOption[]
  /** Currently selected values */
  value: string[]
  /** Change handler */
  onChange: (values: string[]) => void
  /** Placeholder text when nothing selected */
  placeholder?: string
  /** Search input placeholder */
  searchPlaceholder?: string
  /** Empty state text when no results */
  emptyText?: string
  /** Disabled state */
  disabled?: boolean
  /** Maximum number of badges to show before +N */
  maxBadges?: number
  /** Additional className for trigger */
  className?: string
  /** Aria label for remove button template (use {label} placeholder) */
  removeLabel?: string
  /** Aria label for clear all button */
  clearLabel?: string
}

export const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  disabled = false,
  maxBadges = 2,
  className,
  removeLabel,
  clearLabel,
}, ref) => {
  const [open, setOpen] = React.useState(false)

  const selectedOptions = React.useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value]
  )

  const handleSelect = React.useCallback(
    (optionValue: string) => {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue))
      } else {
        onChange([...value, optionValue])
      }
    },
    [value, onChange]
  )

  const handleRemove = React.useCallback(
    (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation()
      onChange(value.filter((v) => v !== optionValue))
    },
    [value, onChange]
  )

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange([])
    },
    [onChange]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={placeholder}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selectedOptions.length && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center overflow-hidden">
            {selectedOptions.length === 0 ? (
              <span>{placeholder}</span>
            ) : selectedOptions.length <= maxBadges ? (
              selectedOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="rounded-sm px-2 font-normal"
                >
                  {option.label}
                  <button
                    type="button"
                    className="ml-1 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={(e) => handleRemove(option.value, e)}
                    aria-label={removeLabel?.replace('{label}', option.label) ?? undefined}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <>
                {selectedOptions.slice(0, maxBadges).map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="rounded-sm px-2 font-normal"
                  >
                    {option.label}
                    <button
                      type="button"
                      className="ml-1 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={(e) => handleRemove(option.value, e)}
                      aria-label={removeLabel?.replace('{label}', option.label) ?? undefined}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Badge variant="secondary" className="rounded-sm px-2 font-normal">
                  +{selectedOptions.length - maxBadges}
                </Badge>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {selectedOptions.length > 0 && (
              <button
                type="button"
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={handleClear}
                aria-label={clearLabel}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
})
MultiSelect.displayName = "MultiSelect"
