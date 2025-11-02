import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { cn } from '@/shared/lib/utils'
import {
  CheckIcon,
  ArchiveBoxIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

export interface BulkActionsToolbarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClearSelection: () => void
  onApprove?: () => void
  onArchive?: () => void
  onDelete?: () => void
  className?: string
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onApprove,
  onArchive,
  onDelete,
  className,
}) => {
  const hasSelection = selectedCount > 0
  const allSelected = selectedCount === totalCount && totalCount > 0
  const someSelected = selectedCount > 0 && selectedCount < totalCount

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3 border-b bg-muted/50',
        'animate-in slide-in-from-top-2 fade-in duration-200',
        className
      )}
    >
      {/* Select All Checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={allSelected ? true : someSelected ? 'indeterminate' : false}
          onCheckedChange={(checked) => {
            if (checked) onSelectAll()
            else onClearSelection()
          }}
          id="select-all"
        />
        <label
          htmlFor="select-all"
          className="text-sm font-medium cursor-pointer select-none"
        >
          {selectedCount} selected
        </label>
      </div>

      {/* Action Buttons */}
      {hasSelection && (
        <div className="flex items-center gap-2 ml-auto">
          {onApprove && (
            <Button size="sm" variant="default" onClick={onApprove}>
              <CheckIcon className="mr-2 h-4 w-4" />
              Approve
            </Button>
          )}

          {onArchive && (
            <Button size="sm" variant="outline" onClick={onArchive}>
              <ArchiveBoxIcon className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}

          {onDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
          >
            <XMarkIcon className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      )}
    </div>
  )
}
