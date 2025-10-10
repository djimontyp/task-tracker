/**
 * Analysis Run Card Component
 */

import React from 'react'
import { Card, Badge, Button } from '@/shared/ui'
import { Clock, PlayCircle, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { formatFullDate } from '@/shared/utils/date'
import type { AnalysisRun } from '../types'

interface RunCardProps {
  run: AnalysisRun
  onClose?: (runId: string) => void
  onStart?: (runId: string) => void
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-slate-500 text-white' },
  running: { label: 'Running', icon: PlayCircle, className: 'bg-blue-500 text-white' },
  completed: { label: 'Waiting Review', icon: AlertCircle, className: 'bg-amber-500 text-white' },
  reviewed: { label: 'Reviewed', icon: CheckCircle, className: 'bg-emerald-500 text-white' },
  closed: { label: 'Closed', icon: CheckCircle, className: 'bg-emerald-700 text-white' },
  failed: { label: 'Failed', icon: XCircle, className: 'bg-rose-500 text-white' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-slate-400 text-white' },
}

export const RunCard: React.FC<RunCardProps> = ({ run, onClose, onStart }) => {
  const statusCfg = statusConfig[run.status]
  const Icon = statusCfg?.icon

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={statusCfg?.className || 'bg-slate-500 text-white'}>
            {Icon && <Icon className="mr-1 h-3 w-3" />}
            {statusCfg?.label || run.status}
          </Badge>
          <span className="text-sm text-muted-foreground capitalize">
            {run.trigger_type}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">ID: {run.id}</div>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <div className="font-medium mb-1">Time Window</div>
          <div className="text-muted-foreground">
            {formatFullDate(run.time_window_start)} → {formatFullDate(run.time_window_end)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <div className="font-medium">Messages</div>
            <div className="text-2xl font-bold">{run.total_messages_in_window}</div>
            {run.messages_after_prefilter !== undefined && (
              <div className="text-xs text-muted-foreground">
                Filtered: {run.messages_after_prefilter}
              </div>
            )}
          </div>
          <div>
            <div className="font-medium">Cost</div>
            <div className="text-2xl font-bold">${run.cost_estimate.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              Tokens: {run.llm_tokens_used}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="font-medium mb-2">Proposals</div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold">{run.proposals_total}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              <span>{run.proposals_approved}</span>
            </div>
            <div className="flex items-center gap-1 text-rose-600">
              <XCircle className="h-4 w-4" />
              <span>{run.proposals_rejected}</span>
            </div>
            {run.proposals_pending > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <Clock className="h-4 w-4" />
                <span>{run.proposals_pending}</span>
              </div>
            )}
          </div>
        </div>

        {run.accuracy_metrics && (
          <div className="pt-2 border-t text-xs space-y-1">
            <div className="font-medium mb-1">Accuracy Metrics</div>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              {run.accuracy_metrics.approval_rate !== undefined && (
                <div>Approval Rate: {(run.accuracy_metrics.approval_rate * 100).toFixed(1)}%</div>
              )}
              {run.accuracy_metrics.rejection_rate !== undefined && (
                <div>Rejection Rate: {(run.accuracy_metrics.rejection_rate * 100).toFixed(1)}%</div>
              )}
              <div>Proposals Count: {run.accuracy_metrics.proposals_total ?? run.proposals_total}</div>
            </div>
          </div>
        )}

        {run.triggered_by_user_id !== null && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Triggered by user #{run.triggered_by_user_id}
          </div>
        )}
      </div>

      {(run.status === 'pending' || run.status === 'completed') && (
        <div className="flex gap-2 mt-4 pt-3 border-t">
          {run.status === 'pending' && onStart && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onStart(run.id)}
              className="flex-1"
            >
              <PlayCircle className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}
          {run.status === 'completed' && onClose && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onClose(run.id)}
              className="flex-1"
            >
              Close Run
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
