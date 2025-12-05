import { Column } from '@tanstack/react-table'
import { Slider } from '@/shared/ui/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Filter, X } from 'lucide-react'
import { ImportanceFilterValue } from './columns'

interface ImportanceScoreFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
}

const DEFAULT_FILTER: ImportanceFilterValue = {
  range: null,
  showUnscored: true,
}

export function ImportanceScoreFilter<TData, TValue>({
  column,
  title,
}: ImportanceScoreFilterProps<TData, TValue>) {
  const filterValue = (column?.getFilterValue() as ImportanceFilterValue | undefined) ?? DEFAULT_FILTER

  // Check if any filter is active
  const hasRangeFilter = filterValue.range !== null
  const hasUnscoredFilter = !filterValue.showUnscored
  const hasFilter = hasRangeFilter || hasUnscoredFilter

  // Get current range or default full range for display
  const displayRange = filterValue.range ?? [0, 1]

  const updateFilter = (updates: Partial<ImportanceFilterValue>) => {
    const newValue: ImportanceFilterValue = {
      ...filterValue,
      ...updates,
    }

    // If no filters active, clear completely
    if (newValue.range === null && newValue.showUnscored) {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(newValue)
    }
  }

  const setRange = (range: [number, number]) => {
    updateFilter({ range })
  }

  const clearRange = () => {
    updateFilter({ range: null })
  }

  const toggleUnscored = (checked: boolean) => {
    updateFilter({ showUnscored: checked })
  }

  const resetAll = () => {
    column?.setFilterValue(undefined)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed"
        >
          <Filter className="mr-2 h-4 w-4" />
          {title}
          {hasFilter && (
            <div className="ml-2 flex items-center gap-2">
              {hasRangeFilter && (
                <div className="rounded bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  {Math.round(displayRange[0] * 100)}-{Math.round(displayRange[1] * 100)}%
                </div>
              )}
              {hasUnscoredFilter && (
                <div className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  scored only
                </div>
              )}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-4" align="start">
        <div className="space-y-4">
          {/* Header with Reset */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Importance Filter</h4>
            {hasFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAll}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="mr-2 h-3 w-3" />
                Reset
              </Button>
            )}
          </div>

          {/* Unscored checkbox */}
          <div className="flex items-center space-x-2 rounded-md border p-4">
            <Checkbox
              id="show-unscored"
              checked={filterValue.showUnscored}
              onCheckedChange={toggleUnscored}
            />
            <label
              htmlFor="show-unscored"
              className="flex-1 text-sm font-medium leading-none cursor-pointer"
            >
              Show unscored messages
            </label>
          </div>

          {/* Score range section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Score range</span>
              {hasRangeFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRange}
                  className="h-5 px-2 text-xs"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <Slider
              min={0}
              max={100}
              step={1}
              value={[displayRange[0] * 100, displayRange[1] * 100]}
              onValueChange={(values) => {
                setRange([values[0] / 100, values[1] / 100])
              }}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(displayRange[0] * 100)}%</span>
              <span>{Math.round(displayRange[1] * 100)}%</span>
            </div>

            {/* Quick filters */}
            <div className="space-y-2 border-t pt-2">
              <div className="text-xs text-muted-foreground">Quick filters:</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={hasRangeFilter && displayRange[0] === 0 && displayRange[1] === 0.3 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRange([0, 0.3])}
                  className="h-6 text-xs"
                >
                  Noise (&lt;30%)
                </Button>
                <Button
                  variant={hasRangeFilter && displayRange[0] === 0.3 && displayRange[1] === 0.7 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRange([0.3, 0.7])}
                  className="h-6 text-xs"
                >
                  Neutral (30-70%)
                </Button>
                <Button
                  variant={hasRangeFilter && displayRange[0] === 0.7 && displayRange[1] === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRange([0.7, 1])}
                  className="h-6 text-xs"
                >
                  Signal (&gt;70%)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
