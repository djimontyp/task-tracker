import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Clock, PlayCircle, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

import { Button, Badge } from '@/shared/ui'
import { formatFullDate } from '@/shared/utils/date'

export interface AnalysisRun {
  id: string
  status: string
  trigger_type: string
  time_window_start: string
  time_window_end: string
  created_at: string
  completed_at: string | null
  closed_at: string | null
  proposals_total: number
  proposals_approved: number
  proposals_rejected: number
  proposals_pending: number
  total_messages_in_window: number
  cost_estimate: number
  accuracy_metrics: {
    approval_rate: number
    avg_confidence: number
    quick_approvals: number
    total_proposals: number
  } | null
  triggered_by: string | null
}

export const statusConfig: Record<string, { label: string; icon: React.ComponentType<any>; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-slate-500 text-white' },
  running: { label: 'Running', icon: PlayCircle, className: 'bg-blue-500 text-white' },
  completed: { label: 'Waiting Review', icon: AlertCircle, className: 'bg-amber-500 text-white' },
  reviewed: { label: 'Reviewed', icon: CheckCircle, className: 'bg-emerald-500 text-white' },
  closed: { label: 'Closed', icon: CheckCircle, className: 'bg-emerald-700 text-white' },
  failed: { label: 'Failed', icon: XCircle, className: 'bg-rose-500 text-white' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-slate-400 text-white' },
}

// Use shared formatFullDate utility

const formatCost = (cost: number) => {
  return `$${cost.toFixed(2)}`
}

export const columns: ColumnDef<AnalysisRun>[] = [
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue<string>('status')
      const config = statusConfig[status]
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
    header: 'Trigger',
    cell: ({ row }) => {
      const triggerType = row.getValue<string>('trigger_type')
      const triggeredBy = row.original.triggered_by

      return (
        <div className="text-sm">
          <div className="font-medium capitalize">{triggerType}</div>
          {triggeredBy && (
            <div className="text-xs text-muted-foreground">by {triggeredBy}</div>
          )}
        </div>
      )
    },
    size: 140,
  },
  {
    accessorKey: 'time_window_start',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Time Window
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
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
    header: 'Proposals',
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
    header: 'Messages',
    cell: ({ row }) => {
      const messages = row.getValue<number>('total_messages_in_window')
      return <div className="text-sm font-medium">{messages}</div>
    },
    size: 100,
  },
  {
    accessorKey: 'cost_estimate',
    header: 'Cost',
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
          <div>Approval: {(metrics.approval_rate * 100).toFixed(1)}%</div>
          <div>Confidence: {(metrics.avg_confidence * 100).toFixed(0)}%</div>
          <div>Quick: {metrics.quick_approvals}/{metrics.total_proposals}</div>
        </div>
      )
    },
    size: 150,
  },
]
