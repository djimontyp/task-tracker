import { Column } from '@tanstack/react-table'
import { Slider } from '@/shared/ui/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Button } from '@/shared/ui/button'
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface ImportanceScoreFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
}

export function ImportanceScoreFilter<TData, TValue>({
  column,
  title,
}: ImportanceScoreFilterProps<TData, TValue>) {
  const filterValue = (column?.getFilterValue() as [number, number]) ?? [0, 1]
  const hasFilter = filterValue[0] !== 0 || filterValue[1] !== 1

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed"
        >
          <FunnelIcon className="mr-2 h-4 w-4" />
          {title}
          {hasFilter && (
            <div className="ml-2 flex items-center gap-1">
              <div className="rounded bg-primary px-1 py-0.5 text-xs font-semibold text-primary-foreground">
                {Math.round(filterValue[0] * 100)}-{Math.round(filterValue[1] * 100)}%
              </div>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Importance Score Range</h4>
            {hasFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => column?.setFilterValue([0, 1])}
                className="h-6 px-2 text-xs"
              >
                <XMarkIcon className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="space-y-3">
            <Slider
              min={0}
              max={100}
              step={1}
              value={[filterValue[0] * 100, filterValue[1] * 100]}
              onValueChange={(values) => {
                column?.setFilterValue([values[0] / 100, values[1] / 100])
              }}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(filterValue[0] * 100)}%</span>
              <span>{Math.round(filterValue[1] * 100)}%</span>
            </div>
            <div className="space-y-1 border-t pt-2">
              <div className="text-xs text-muted-foreground">Quick filters:</div>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => column?.setFilterValue([0, 0.3])}
                  className="h-6 text-xs"
                >
                  Noise (&lt;30%)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => column?.setFilterValue([0.3, 0.7])}
                  className="h-6 text-xs"
                >
                  Weak (30-70%)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => column?.setFilterValue([0.7, 1])}
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
