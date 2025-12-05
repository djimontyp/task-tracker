import type { BadgeProps } from '@/shared/ui/badge'

export type BadgeVariant = BadgeProps['variant']

/**
 * Get badge variant for job status
 * Used in JobsTable to display job execution status
 */
export const getJobStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'destructive'
    case 'running':
      return 'secondary'
    default:
      return 'default'
  }
}

/**
 * Get badge variant for automation rule action
 * Used in RulePerformanceTable to display rule actions
 */
export const getRuleActionVariant = (action: string): BadgeVariant => {
  switch (action) {
    case 'approve':
      return 'success'
    case 'reject':
      return 'destructive'
    case 'escalate':
      return 'secondary'
    case 'notify':
      return 'default'
    default:
      return 'default'
  }
}

/**
 * Get badge variant for task status
 * Used in TaskHistoryTable to display task execution status
 */
export const getTaskStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'success':
    case 'completed':
      return 'success'
    case 'failed':
    case 'error':
      return 'destructive'
    case 'running':
    case 'pending':
      return 'secondary'
    case 'cancelled':
      return 'outline'
    default:
      return 'default'
  }
}
