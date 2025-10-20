/**
 * Proposal Card Component
 */

import React, { useState } from 'react'
import { Card, Badge, Button } from '@/shared/ui'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { formatFullDate } from '@/shared/utils/date'
import type { TaskProposal } from '../types'

interface ProposalCardProps {
  proposal: TaskProposal
  onApprove?: (proposalId: string) => void
  onReject?: (proposalId: string) => void
  onEdit?: (proposalId: string) => void
  isLoading?: boolean
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'badge-neutral' },
  medium: { label: 'Medium', className: 'badge-info' },
  high: { label: 'High', className: 'badge-critical' },
  critical: { label: 'Critical', className: 'badge-error' },
}

const statusConfig = {
  pending: { label: 'Pending', className: 'badge-warning' },
  approved: { label: 'Approved', className: 'badge-success' },
  rejected: { label: 'Rejected', className: 'badge-error' },
  merged: { label: 'Merged', className: 'badge-purple' },
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  onApprove,
  onReject,
  onEdit,
  isLoading,
}) => {
  const [showReasoning, setShowReasoning] = useState(false)
  const [showSources, setShowSources] = useState(false)

  const getConfidenceBadge = (confidence: number) => {
    if (confidence < 0.7) {
      return <Badge variant="outline" className="badge-error">Low {(confidence * 100).toFixed(0)}%</Badge>
    }
    if (confidence < 0.9) {
      return <Badge variant="outline" className="badge-warning">Medium {(confidence * 100).toFixed(0)}%</Badge>
    }
    return <Badge variant="outline" className="badge-success">High {(confidence * 100).toFixed(0)}%</Badge>
  }

  const priorityCfg = priorityConfig[proposal.proposed_priority] ?? {
    label: proposal.proposed_priority,
    className: 'badge-neutral',
  }
  const statusCfg = statusConfig[proposal.status]

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={statusCfg.className}>{statusCfg.label}</Badge>
              <Badge variant="outline" className={priorityCfg.className}>{priorityCfg.label}</Badge>
              {getConfidenceBadge(proposal.confidence)}
              {proposal.similar_task_id && (
                <Badge variant="outline" className="badge-warning flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-3 w-3" />
                  Similar Task
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold">{proposal.proposed_title}</h3>
          </div>
          <div className="text-xs text-muted-foreground">
            ID: {proposal.id.slice(0, 8)}
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-sm text-muted-foreground">{proposal.proposed_description}</p>
        </div>

        {/* Category */}
        <div className="text-sm">
          <span className="text-muted-foreground">Category:</span>{' '}
          <span className="font-medium">{proposal.proposed_category}</span>
        </div>

        {proposal.proposed_tags.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Tags:</span>{' '}
            <span className="font-medium">
              {proposal.proposed_tags.join(', ')}
            </span>
          </div>
        )}

        {proposal.project_keywords_matched && proposal.project_keywords_matched.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Matched Keywords:{' '}
            <span className="font-medium text-foreground">
              {proposal.project_keywords_matched.join(', ')}
            </span>
          </div>
        )}

        {/* Source messages count */}
        <div className="text-sm">
          <span className="text-muted-foreground">Source messages:</span>{' '}
          <span className="font-medium">{proposal.source_message_ids.length}</span>
        </div>

        {/* LLM Reasoning (expandable) */}
        <div className="border-t pt-2">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            aria-expanded={showReasoning}
            aria-label="Toggle LLM reasoning details"
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            {showReasoning ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            LLM Reasoning
          </button>
          {showReasoning && (
            <div className="mt-2 p-3 bg-muted rounded-md text-sm">
              <pre className="whitespace-pre-wrap font-mono text-xs">{proposal.reasoning}</pre>
            </div>
          )}
        </div>

        {/* Source messages (expandable) */}
        <div className="border-t pt-2">
          <button
            onClick={() => setShowSources(!showSources)}
            aria-expanded={showSources}
            aria-label={`Toggle source messages list (${proposal.source_message_ids.length} items)`}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            {showSources ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            Source Messages ({proposal.source_message_ids.length})
          </button>
          {showSources && (
            <div className="mt-2 p-3 bg-muted rounded-md text-sm space-y-1">
              {proposal.source_message_ids.map((msgId) => (
                <div key={msgId} className="text-xs text-muted-foreground font-mono">
                  {msgId}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rejection reason */}
        {proposal.review_notes && (
          <div className="border-t pt-2">
            <div className="text-sm font-medium text-rose-600 mb-1">Review Notes:</div>
            <p className="text-sm text-muted-foreground">{proposal.review_notes}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          <div>Created: {formatFullDate(proposal.created_at)}</div>
          {proposal.reviewed_at && (
            <div>Reviewed: {formatFullDate(proposal.reviewed_at)}</div>
          )}
        </div>

        {/* Actions (only for pending proposals) */}
        {proposal.status === 'pending' && (onApprove || onReject || onEdit) && (
          <div className="flex gap-2 pt-3 border-t">
            {onApprove && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onApprove(proposal.id)}
                disabled={isLoading}
                className="flex-1"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(proposal.id)}
                disabled={isLoading}
              >
                Edit
              </Button>
            )}
            {onReject && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(proposal.id)}
                disabled={isLoading}
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                Reject
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
