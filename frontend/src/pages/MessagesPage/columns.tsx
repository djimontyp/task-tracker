import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Mail, User, X, Info } from 'lucide-react'
import type { TFunction } from 'i18next'

import { Checkbox, Button, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui'
import { DataTableColumnHeader } from '@/shared/components/DataTableColumnHeader'
import { Message, NoiseClassification } from '@/shared/types'
import { formatFullDate } from '@/shared/utils/date'
import {
  getMessageAnalysisBadge,
  getNoiseClassificationBadge,
  getImportanceBadge,
  getClassificationFromScore,
} from '@/shared/utils/statusBadges'
import type { ScoringConfig } from '@/shared/api/scoringConfig'

export interface ColumnsCallbacks {
  onReset?: () => void
  hasActiveFilters?: boolean
  onCheckboxClick?: (rowId: string, event: React.MouseEvent) => void
  /** Scoring config for dynamic thresholds (optional, uses defaults if not provided) */
  scoringConfig?: ScoringConfig
  /** Translation function for i18n */
  t: TFunction
}

// Type for importance score filter with separate unscored toggle
export interface ImportanceFilterValue {
  range: [number, number] | null  // null = no range filter applied
  showUnscored: boolean           // true = include messages without score
}

/** Get source labels with translation support */
export const getSourceLabels = (t: TFunction): Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> => ({
  telegram: { label: t('messages:columns.sources.telegram'), icon: Mail },
  api: { label: t('messages:columns.sources.api'), icon: Mail },
  slack: { label: t('messages:columns.sources.slack'), icon: Mail },
})


export const createColumns = (callbacks: ColumnsCallbacks): ColumnDef<Message>[] => {
  const { t } = callbacks

  return [
  {
    id: 'select',
    size: 40,
    minSize: 40,
    maxSize: 40,
    enableResizing: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label={t('messages:columns.aria.selectAll')}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(event) => {
          event.stopPropagation()
          if (callbacks?.onCheckboxClick) {
            callbacks.onCheckboxClick(row.id, event)
          }
        }}
        aria-label={t('messages:columns.aria.selectRow')}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    size: 70,
    minSize: 50,
    header: 'ID',
    cell: ({ row }) => {
      const id = row.getValue<number | string>('id')
      return <div className="text-xs font-mono text-muted-foreground">{String(id).padStart(4, '0')}</div>
    },
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: 'author_name',
    size: 150,
    minSize: 100,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('messages:columns.author')} />
    ),
    cell: ({ row }) => {
      const authorName = row.getValue<string>('author_name') || row.original.author
      const avatarUrl = row.original.avatar_url
      return (
        <div className="flex items-center space-x-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt={authorName} className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="font-medium truncate">{authorName}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'content',
    size: 400,
    minSize: 200,
    header: t('messages:columns.content'),
    cell: ({ row }) => {
      const content = row.getValue<string>('content')
      const isEmpty = !content || content.trim() === ''
      const isLong = content && content.length > 100

      if (isEmpty) {
        return (
          <div className="flex items-center gap-2 text-muted-foreground/50 italic text-sm">
            <Mail className="h-4 w-4" />
            <span>{t('messages:columns.emptyMessage')}</span>
          </div>
        )
      }

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="truncate" aria-label={isLong ? `Message content: ${content}` : undefined}>
                {content}
              </div>
            </TooltipTrigger>
            {isLong && (
              <TooltipContent className="max-w-md">
                <p className="text-sm whitespace-pre-wrap">{content}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )
    },
  },
  {
    accessorKey: 'source_name',
    size: 120,
    minSize: 80,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('messages:columns.source')} />
    ),
    cell: ({ row }) => {
      const value = row.getValue<string>('source_name')
      const sourceLabels = getSourceLabels(t)
      const meta = sourceLabels[value] ?? { label: value, icon: Mail }
      const Icon = meta.icon
      return (
        <div className="flex items-center">
          {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
          <span>{meta.label}</span>
        </div>
      )
    },
    filterFn: (row, id, filterValues: string[]) => {
      if (!filterValues || filterValues.length === 0) return true
      const v = row.getValue<string>(id)
      return filterValues.includes(v)
    },
    meta: {
      className: 'hidden md:table-cell',
    },
  },
  {
    accessorKey: 'analyzed',
    size: 100,
    minSize: 80,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('messages:columns.status')} />
    ),
    cell: ({ row }) => {
      const analyzed = row.getValue<boolean>('analyzed')
      const config = getMessageAnalysisBadge(analyzed)
      return (
        <Badge
          variant={config.variant}
          className={config.className}
          aria-label={`Message status: ${config.label}`}
        >
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, filterValues: string[]) => {
      if (!filterValues || filterValues.length === 0) return true
      const analyzed = row.getValue<boolean>(id)
      const status = analyzed ? 'analyzed' : 'pending'
      return filterValues.includes(status)
    },
  },
  {
    accessorKey: 'importance_score',
    size: 130,
    minSize: 100,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('messages:columns.importance')} />
    ),
    cell: ({ row }) => {
      const score = row.getValue<number>('importance_score')
      if (score === undefined || score === null) return <div className="text-muted-foreground text-xs">-</div>

      const config = getImportanceBadge(score, callbacks?.scoringConfig)
      const percentage = Math.round(score * 100)

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col gap-2">
                <Badge
                  variant={config.variant}
                  className={`inline-flex items-center gap-2 ${config.className}`}
                  aria-label={`Importance: ${config.label} (${percentage}%)`}
                >
                  {config.label}
                  {row.original.noise_factors && (
                    <Info className="h-3 w-3" aria-hidden="true" />
                  )}
                </Badge>
                <span className="text-xs text-muted-foreground">{percentage}%</span>
              </div>
            </TooltipTrigger>
            {row.original.noise_factors && (
              <TooltipContent>
                <div className="space-y-2 text-xs">
                  <div><strong>{t('messages:columns.factorsBreakdown')}:</strong></div>
                  <div>{t('messages:noise.scoreBreakdown.factors.content.label')}: {Math.round(row.original.noise_factors.content * 100)}%</div>
                  <div>{t('messages:noise.scoreBreakdown.factors.author.label')}: {Math.round(row.original.noise_factors.author * 100)}%</div>
                  <div>{t('messages:noise.scoreBreakdown.factors.temporal.label')}: {Math.round(row.original.noise_factors.temporal * 100)}%</div>
                  <div>{t('messages:noise.scoreBreakdown.factors.topics.label')}: {Math.round(row.original.noise_factors.topics * 100)}%</div>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )
    },
    filterFn: (row, id, filterValue: ImportanceFilterValue | undefined) => {
      // No filter = show all
      if (!filterValue) return true

      const score = row.getValue<number | null>(id)
      const hasScore = score !== null && score !== undefined

      // Handle unscored messages
      if (!hasScore) {
        return filterValue.showUnscored
      }

      // Handle scored messages - if no range filter, show all scored
      if (!filterValue.range) return true
      return score >= filterValue.range[0] && score <= filterValue.range[1]
    },
    meta: {
      className: 'hidden md:table-cell',
    },
  },
  {
    accessorKey: 'noise_classification',
    size: 130,
    minSize: 100,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('messages:columns.classification')} />
    ),
    cell: ({ row }) => {
      const score = row.getValue<number>('importance_score')
      const classification = row.original.noise_classification ?? (score !== undefined ? getClassificationFromScore(score, callbacks?.scoringConfig) : null)

      if (!classification) return <div className="text-muted-foreground text-xs">-</div>

      const config = getNoiseClassificationBadge(classification)
      return (
        <Badge
          variant={config.variant}
          className={config.className}
          aria-label={`Classification: ${config.label}`}
        >
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, _id, filterValues: NoiseClassification[]) => {
      if (!filterValues || filterValues.length === 0) return true
      const score = row.getValue<number>('importance_score')
      const classification = row.original.noise_classification ?? (score !== undefined ? getClassificationFromScore(score, callbacks?.scoringConfig) : null)
      if (!classification) return false
      return filterValues.includes(classification)
    },
    meta: {
      className: 'hidden md:table-cell',
    },
  },
  {
    accessorKey: 'topic_name',
    size: 150,
    minSize: 100,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('messages:columns.topic')} />
    ),
    cell: ({ row }) => {
      const topicName = row.getValue<string | null>('topic_name')
      if (!topicName) return <div className="text-muted-foreground text-xs">-</div>

      const isLong = topicName.length > 20
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="truncate max-w-[150px] lg:max-w-[180px] 2xl:max-w-[250px]">
                {topicName}
              </Badge>
            </TooltipTrigger>
            {isLong && (
              <TooltipContent>
                <p>{topicName}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )
    },
    meta: {
      className: 'hidden md:table-cell',
    },
  },
  {
    accessorKey: 'sent_at',
    size: 140,
    minSize: 100,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('messages:columns.sentAt')} />
    ),
    cell: ({ row }) => {
      const d = row.getValue<string>('sent_at')
      return <div className="text-muted-foreground text-xs">{d ? formatFullDate(d) : '-'}</div>
    },
    enableHiding: true,
    meta: {
      className: 'hidden lg:table-cell',
    },
  },
  {
    id: 'actions',
    size: 60,
    minSize: 60,
    maxSize: 60,
    enableResizing: false,
    header: () => {
      if (callbacks?.hasActiveFilters) {
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={callbacks.onReset}
            className="hover:bg-destructive/10"
          >
            <X className="h-4 w-4 text-destructive/70 hover:text-destructive" />
            <span className="sr-only">{t('messages:columns.actions.resetFilters')}</span>
          </Button>
        )
      }
      return null
    },
    enableHiding: false,
    cell: ({ row }) => {
      const message = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-11 w-11 p-0" aria-label={t('messages:columns.aria.actionsFor', { id: message.id })}>
              <span className="sr-only">{t('messages:columns.actions.openMenu')}</span>
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('messages:columns.actions.label')}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(String(message.id))}>
              {t('messages:columns.actions.copyId')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('messages:columns.actions.viewDetails')}</DropdownMenuItem>
            <DropdownMenuItem>{t('messages:columns.actions.delete')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
}
