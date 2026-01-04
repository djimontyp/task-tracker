import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { cn } from '@/shared/lib/utils'
import { AdminFeatureBadge } from '@/shared/components'
import {
  Check,
  Archive,
  Trash,
  X,
} from 'lucide-react'

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
  const { t } = useTranslation('common')
  const hasSelection = selectedCount > 0
  const allSelected = selectedCount === totalCount && totalCount > 0
  const someSelected = selectedCount > 0 && selectedCount < totalCount

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-4 border-b bg-muted/50',
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
          {t('bulkActions.selected', { count: selectedCount })}
        </label>
        <AdminFeatureBadge variant="inline" size="sm" />
      </div>

      {/* Action Buttons */}
      {hasSelection && (
        <div className="flex items-center gap-2 ml-auto">
          {onApprove && (
            <Button size="sm" variant="default" onClick={onApprove}>
              <Check className="mr-2 h-4 w-4" />
              {t('bulkActions.approve')}
            </Button>
          )}

          {onArchive && (
            <Button size="sm" variant="outline" onClick={onArchive}>
              <Archive className="mr-2 h-4 w-4" />
              {t('bulkActions.archive')}
            </Button>
          )}

          {onDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
            >
              <Trash className="mr-2 h-4 w-4" />
              {t('bulkActions.delete')}
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
          >
            <X className="mr-2 h-4 w-4" />
            {t('bulkActions.clear')}
          </Button>
        </div>
      )}
    </div>
  )
}
