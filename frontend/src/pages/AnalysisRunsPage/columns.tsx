import { ColumnDef } from '@tanstack/react-table'
import { Clock, PlayCircle, CheckCircle, XCircle, AlertCircle, LucideIcon, X, Calendar, Webhook, UserCircle } from 'lucide-react'

import { Button, Badge, Checkbox } from '@/shared/ui'
import { formatFullDate } from '@/shared/utils/date'
import { DataTableColumnHeader } from '@/shared/components/DataTableColumnHeader'
import type { AnalysisRun, AnalysisRunStatus, AnalysisRunTriggerType } from '@/features/analysis/types'

export const statusConfig: Record<AnalysisRunStatus, { label: string; icon: LucideIcon; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-slate-500 text-white' },
  running: { label: 'Running', icon: PlayCircle, className: 'bg-blue-500 text-white' },
  completed: { label: 'Waiting Review', icon: AlertCircle, className: 'bg-amber-500 text-white' },
  reviewed: { label: 'Reviewed', icon: CheckCircle, className: 'bg-emerald-500 text-white' },
  closed: { label: 'Closed', icon: CheckCircle, className: 'bg-emerald-700 text-white' },
  failed: { label: 'Failed', icon: XCircle, className: 'bg-rose-500 text-white' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-slate-400 text-white' },
}

export const triggerTypeLabels: Record<AnalysisRunTriggerType, { label: string; icon: LucideIcon }> = {
  manual: { label: 'Manual', icon: UserCircle },
  scheduled: { label: 'Scheduled', icon: Calendar },
  custom: { label: 'Custom', icon: PlayCircle },
  webhook: { label: 'Webhook', icon: Webhook },
}

const formatCost = (cost: number) => {
  return `$${cost.toFixed(2)}`
}

export interface ColumnsCallbacks {
  onStartRun?: (runId: string) => void
  onCloseRun?: (runId: string) => void
  onReset?: () => void
  hasActiveFilters?: boolean
}

export const createColumns = (callbacks?: ColumnsCallbacks): ColumnDef<AnalysisRun>[] => [
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
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 28,
  },
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => {
      const id = row.getValue<string>('id')
      // Format as RUN-XXXX using first 4 chars of UUID
      return <div className="w-[80px] text-xs font-medium text-muted-foreground">RUN-{id.slice(0, 4).toUpperCase()}</div>
    },
    enableSorting: false,
    size: 80,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue<AnalysisRunStatus>('status')
      const config = statusConfig[status] ?? statusConfig.pending
      const Icon = config?.icon

      return (
        <Badge className={config?.className || 'bg-slate-500 text-white'}>
          {Icon && <Icon className="mr-1 h-3 w-3" />}
          {config?.label || status}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    size: 120,
  },
  {
    accessorKey: 'trigger_type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trigger" />
    ),
    cell: ({ row }) => {
      const triggerType = row.getValue<AnalysisRunTriggerType>('trigger_type')
      const triggeredByUserId = row.original.triggered_by_user_id
      const meta = triggerTypeLabels[triggerType] ?? { label: triggerType, icon: UserCircle }
      const Icon = meta.icon

      return (
        <div className="text-sm">
          <div className="flex items-center gap-2 font-medium">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            {meta.label}
          </div>
          {triggeredByUserId !== null && (
            <div className="text-xs text-muted-foreground">user #{triggeredByUserId}</div>
          )}
        </div>
      )
    },
    filterFn: (row, id, filterValues: string[]) => {
      if (!filterValues || filterValues.length === 0) return true
      const v = row.getValue<string>(id)
      return filterValues.includes(v)
    },
    size: 140,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const d = row.getValue<string>('created_at')
      return <div className="text-muted-foreground text-xs">{d ? formatFullDate(d) : '-'}</div>
    },
    size: 150,
  },
  {
    accessorKey: 'time_window_start',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Time Window" />
    ),
    cell: ({ row }) => {
      const start = row.getValue<string>('time_window_start')
      const end = row.original.time_window_end

      return (
        <div className="text-sm">
          <div>{formatFullDate(start)}</div>
          <div className="text-xs text-muted-foreground">to</div>
          <div>{formatFullDate(end)}</div>
        </div>
      )
    },
    size: 200,
  },
  {
    accessorKey: 'proposals_total',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Proposals" />
    ),
    cell: ({ row }) => {
      const total = row.getValue<number>('proposals_total')
      const approved = row.original.proposals_approved
      const rejected = row.original.proposals_rejected
      const pending = row.original.proposals_pending

      return (
        <div className="text-sm">
          <div className="font-medium">Total: {total}</div>
          <div className="flex gap-2 text-xs mt-1">
            <span className="text-emerald-600">✓ {approved}</span>
            <span className="text-rose-600">✗ {rejected}</span>
            {pending > 0 && (
              <span className="text-amber-600">⏳ {pending}</span>
            )}
          </div>
        </div>
      )
    },
    size: 140,
  },
  {
    accessorKey: 'total_messages_in_window',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Messages" />
    ),
    cell: ({ row }) => {
      const messages = row.getValue<number>('total_messages_in_window')
      return <div className="text-sm font-medium">{messages}</div>
    },
    size: 100,
  },
  {
    accessorKey: 'cost_estimate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cost" />
    ),
    cell: ({ row }) => {
      const cost = row.getValue<number>('cost_estimate')
      return <div className="text-sm font-medium">{formatCost(cost)}</div>
    },
    size: 100,
  },
  {
    id: 'metrics',
    header: 'Metrics',
    cell: ({ row }) => {
      const metrics = row.original.accuracy_metrics

      if (!metrics) {
        return <div className="text-xs text-muted-foreground">Not available</div>
      }

      return (
        <div className="text-xs space-y-1">
          {metrics.approval_rate !== undefined && (
            <div>Approval: {(metrics.approval_rate * 100).toFixed(1)}%</div>
          )}
          {metrics.rejection_rate !== undefined && (
            <div>Rejection: {(metrics.rejection_rate * 100).toFixed(1)}%</div>
          )}
          <div>Total Proposals: {metrics.proposals_total ?? row.original.proposals_total}</div>
        </div>
      )
    },
    size: 150,
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
            <X className="h-4 w-4 text-destructive/70 hover:text-destructive" />
            <span className="sr-only">Reset filters</span>
          </Button>
        )
      }
      return null
    },
    enableHiding: false,
    cell: ({ row }) => {
      const status = row.original.status
      const runId = row.original.id

      return (
        <div className="flex gap-2">
          {status === 'pending' && callbacks?.onStartRun && (
            <Button size="sm" onClick={() => callbacks.onStartRun!(runId)}>
              <PlayCircle className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}
          {(status === 'completed' || status === 'reviewed') && callbacks?.onCloseRun && (
            <Button size="sm" variant="outline" onClick={() => callbacks.onCloseRun!(runId)}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Close
            </Button>
          )}
        </div>
      )
    },
    size: 150,
  },
]

// Legacy export for backward compatibility
export const columns = createColumns()
