import { ColumnDef } from '@tanstack/react-table'
import { EllipsisHorizontalIcon, EnvelopeIcon, UserIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

import { Checkbox, Button, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui'
import { DataTableColumnHeader } from '@/shared/components/DataTableColumnHeader'
import { Message, NoiseClassification } from '@/shared/types'
import { formatFullDate } from '@/shared/utils/date'
import { getStatusClasses } from '@/shared/config/statusColors'

export interface ColumnsCallbacks {
  onReset?: () => void
  hasActiveFilters?: boolean
}

export const sourceLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  telegram: { label: 'Telegram', icon: EnvelopeIcon },
  api: { label: 'API', icon: EnvelopeIcon },
  slack: { label: 'Slack', icon: EnvelopeIcon },
}

export const statusLabels: Record<string, { label: string }> = {
  analyzed: { label: 'Analyzed' },
  pending: { label: 'Pending' },
}

export const classificationLabels: Record<NoiseClassification, { label: string; statusType: 'success' | 'warning' | 'error' }> = {
  signal: { label: 'Signal', statusType: 'success' },
  weak_signal: { label: 'Needs Review', statusType: 'warning' },
  noise: { label: 'Noise', statusType: 'error' },
}

const getImportanceConfig = (score: number): { variant: 'default' | 'destructive' | 'outline' | 'secondary'; label: string; color: string } => {
  if (score >= 0.7) return { variant: 'default', label: 'High', color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/50' }
  if (score >= 0.4) return { variant: 'outline', label: 'Medium', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/50' }
  return { variant: 'destructive', label: 'Low', color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/50' }
}

const getClassification = (score: number): NoiseClassification => {
  if (score < 0.3) return 'noise'
  if (score < 0.7) return 'weak_signal'
  return 'signal'
}

export const createColumns = (callbacks?: ColumnsCallbacks): ColumnDef<Message>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 28,
  },
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => {
      const id = row.getValue<number | string>('id')
      return <div className="w-[60px] text-xs font-medium text-muted-foreground">MSG-{String(id).padStart(4, '0')}</div>
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'author_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Author" />
    ),
    cell: ({ row }) => {
      const authorName = row.getValue<string>('author_name') || row.original.author
      const avatarUrl = row.original.avatar_url
      return (
        <div className="flex items-center space-x-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt={authorName} className="h-6 w-6 rounded-full" />
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="font-medium">{authorName}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'content',
    header: 'Content',
    cell: ({ row }) => {
      const content = row.getValue<string>('content')
      const isLong = content && content.length > 100
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="max-w-[400px] truncate" aria-label={isLong ? `Message content: ${content}` : undefined}>
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
    cell: ({ row }) => {
      const value = row.getValue<string>('source_name')
      const meta = sourceLabels[value] ?? { label: value, icon: EnvelopeIcon }
      const Icon = meta.icon
      return (
        <div className="flex w-[100px] items-center">
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
  },
  {
    accessorKey: 'analyzed',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const analyzed = row.getValue<boolean>('analyzed')
      const statusText = analyzed ? 'Analyzed' : 'Pending'
      const statusClasses = analyzed ? getStatusClasses('success') : getStatusClasses('info')
      return (
        <Badge
          variant="outline"
          className={statusClasses}
          aria-label={`Message status: ${statusText}`}
        >
          {statusText}
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Importance" />
    ),
    cell: ({ row }) => {
      const score = row.getValue<number>('importance_score')
      if (score === undefined || score === null) return <div className="text-muted-foreground text-xs">-</div>

      const config = getImportanceConfig(score)
      const percentage = Math.round(score * 100)

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col gap-1">
                <Badge
                  variant="outline"
                  className={`inline-flex items-center gap-1 ${config.color}`}
                  aria-label={`Importance: ${config.label} (${percentage}%)`}
                >
                  {config.label}
                  {row.original.noise_factors && (
                    <InformationCircleIcon className="h-3 w-3" aria-hidden="true" />
                  )}
                </Badge>
                <span className="text-xs text-muted-foreground">{percentage}%</span>
              </div>
            </TooltipTrigger>
            {row.original.noise_factors && (
              <TooltipContent>
                <div className="space-y-1 text-xs">
                  <div><strong>Factors breakdown:</strong></div>
                  <div>Content: {Math.round(row.original.noise_factors.content * 100)}%</div>
                  <div>Author: {Math.round(row.original.noise_factors.author * 100)}%</div>
                  <div>Temporal: {Math.round(row.original.noise_factors.temporal * 100)}%</div>
                  <div>Topics: {Math.round(row.original.noise_factors.topics * 100)}%</div>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )
    },
    filterFn: (row, id, filterValue: [number, number]) => {
      if (!filterValue) return true
      const score = row.getValue<number>(id)
      if (score === undefined || score === null) return false
      return score >= filterValue[0] && score <= filterValue[1]
    },
  },
  {
    accessorKey: 'noise_classification',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Classification" />
    ),
    cell: ({ row }) => {
      const score = row.getValue<number>('importance_score')
      const classification = row.original.noise_classification ?? (score !== undefined ? getClassification(score) : null)

      if (!classification) return <div className="text-muted-foreground text-xs">-</div>

      const meta = classificationLabels[classification]
      return (
        <Badge
          variant="outline"
          className={getStatusClasses(meta.statusType)}
          aria-label={`Classification: ${meta.label}`}
        >
          {meta.label}
        </Badge>
      )
    },
    filterFn: (row, _id, filterValues: NoiseClassification[]) => {
      if (!filterValues || filterValues.length === 0) return true
      const score = row.getValue<number>('importance_score')
      const classification = row.original.noise_classification ?? (score !== undefined ? getClassification(score) : null)
      if (!classification) return false
      return filterValues.includes(classification)
    },
  },
  {
    accessorKey: 'topic_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Topic" />
    ),
    cell: ({ row }) => {
      const topicName = row.getValue<string | null>('topic_name')
      if (!topicName) return <div className="text-muted-foreground text-xs">-</div>
      return <Badge variant="outline">{topicName}</Badge>
    },
  },
  {
    accessorKey: 'sent_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sent At" />
    ),
    cell: ({ row }) => {
      const d = row.getValue<string>('sent_at')
      return <div className="text-muted-foreground text-xs">{d ? formatFullDate(d) : '-'}</div>
    },
  },
  {
    id: 'actions',
    header: () => {
      if (callbacks?.hasActiveFilters) {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={callbacks.onReset}
            className="h-8 w-8 p-0 hover:bg-destructive/10"
          >
            <XMarkIcon className="h-4 w-4 text-destructive/70 hover:text-destructive" />
            <span className="sr-only">Reset filters</span>
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
            <Button variant="ghost" className="h-8 w-8 p-0" aria-label={`Actions for message ${message.id}`}>
              <span className="sr-only">Open menu</span>
              <EllipsisHorizontalIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(String(message.id))}>
              Copy message ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// Legacy export for backward compatibility
export const columns = createColumns()
