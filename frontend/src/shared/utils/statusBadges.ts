/**
 * Centralized status-to-badge-variant mapping system
 *
 * Ensures visual consistency across all data tables:
 * - Messages (analyzed status, classification, importance)
 * - Analysis Runs (run status)
 * - Tasks (task status, priority)
 * - Topics, Atoms, etc.
 *
 * @see frontend/src/shared/ui/badge.tsx - Available badge variants
 * @see frontend/src/shared/config/statusColors.ts - WCAG compliant color system
 */

import type { NoiseClassification } from '@/shared/types'
import { getStatusClasses } from '@/shared/config/statusColors'

/**
 * Badge configuration with variant and optional custom classes
 */
export interface BadgeConfig {
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
  className?: string
  label?: string
}

// ============================================================================
// ANALYSIS RUN STATUSES
// ============================================================================

export type AnalysisRunStatus = 'pending' | 'running' | 'completed' | 'reviewed' | 'closed' | 'failed' | 'cancelled'

/**
 * Maps analysis run status to badge configuration
 *
 * Status flow: pending → running → completed → reviewed → closed
 * Alternative flows: → failed, → cancelled
 */
export const getAnalysisRunBadge = (status: AnalysisRunStatus): BadgeConfig => {
  const configs: Record<AnalysisRunStatus, BadgeConfig> = {
    pending: {
      variant: 'outline',
      className: getStatusClasses('info'),
      label: 'Pending',
    },
    running: {
      variant: 'outline',
      className: getStatusClasses('info'),
      label: 'Running',
    },
    completed: {
      variant: 'outline',
      className: getStatusClasses('warning'),
      label: 'Waiting Review',
    },
    reviewed: {
      variant: 'outline',
      className: getStatusClasses('success'),
      label: 'Reviewed',
    },
    closed: {
      variant: 'success',
      className: '',
      label: 'Closed',
    },
    failed: {
      variant: 'destructive',
      className: '',
      label: 'Failed',
    },
    cancelled: {
      variant: 'outline',
      className: 'bg-muted text-muted-foreground border-border font-semibold',
      label: 'Cancelled',
    },
  }
  return configs[status]
}

// ============================================================================
// MESSAGE ANALYSIS STATUSES
// ============================================================================

/**
 * Maps message analysis status to badge configuration
 *
 * - analyzed (true): Message has been processed by AI
 * - pending (false): Awaiting analysis
 */
export const getMessageAnalysisBadge = (analyzed: boolean): BadgeConfig => {
  if (analyzed) {
    return {
      variant: 'outline',
      className: getStatusClasses('success'),
      label: 'Analyzed',
    }
  }
  return {
    variant: 'outline',
    className: getStatusClasses('info'),
    label: 'Pending',
  }
}

// ============================================================================
// MESSAGE NOISE CLASSIFICATION
// ============================================================================

/**
 * Maps noise classification to badge configuration
 *
 * Based on importance_score:
 * - signal (≥0.7): High-value message
 * - weak_signal (0.3-0.7): Needs review
 * - noise (<0.3): Low-value message
 */
export const getNoiseClassificationBadge = (classification: NoiseClassification): BadgeConfig => {
  const configs: Record<NoiseClassification, BadgeConfig> = {
    signal: {
      variant: 'outline',
      className: getStatusClasses('success'),
      label: 'Signal',
    },
    weak_signal: {
      variant: 'outline',
      className: getStatusClasses('warning'),
      label: 'Needs Review',
    },
    noise: {
      variant: 'outline',
      className: getStatusClasses('error'),
      label: 'Noise',
    },
  }
  return configs[classification]
}

// ============================================================================
// MESSAGE IMPORTANCE SCORE
// ============================================================================

/**
 * Maps importance score (0-1) to badge configuration
 *
 * Thresholds:
 * - High: ≥0.7
 * - Medium: 0.4-0.7
 * - Low: <0.4
 */
export const getImportanceBadge = (score: number): BadgeConfig => {
  if (score >= 0.7) {
    return {
      variant: 'outline',
      className: 'bg-semantic-success/10 text-semantic-success border-semantic-success/50',
      label: 'High',
    }
  }
  if (score >= 0.4) {
    return {
      variant: 'outline',
      className: 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/50',
      label: 'Medium',
    }
  }
  return {
    variant: 'outline',
    className: 'bg-semantic-error/10 text-semantic-error border-semantic-error/50',
    label: 'Low',
  }
}

// ============================================================================
// TASK STATUSES
// ============================================================================

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'closed' | 'pending'

/**
 * Maps task status to badge configuration
 *
 * Status flow: open → in_progress → completed → closed
 *
 * Note: Tasks display icon + text without badge wrapper (legacy design)
 * This mapping is provided for future consistency if badges are added
 */
export const getTaskStatusBadge = (status: TaskStatus): BadgeConfig => {
  const configs: Record<TaskStatus, BadgeConfig> = {
    pending: {
      variant: 'outline',
      className: getStatusClasses('info'),
      label: 'Pending',
    },
    open: {
      variant: 'outline',
      className: getStatusClasses('info'),
      label: 'Backlog',
    },
    in_progress: {
      variant: 'outline',
      className: getStatusClasses('warning'),
      label: 'In Progress',
    },
    completed: {
      variant: 'success',
      className: '',
      label: 'Done',
    },
    closed: {
      variant: 'outline',
      className: 'bg-muted text-muted-foreground border-border font-semibold',
      label: 'Canceled',
    },
  }
  return configs[status]
}

// ============================================================================
// TASK PRIORITIES
// ============================================================================

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical'

/**
 * Maps task priority to badge configuration
 *
 * Note: Tasks currently display text-only without badges
 * This mapping is provided for future consistency
 */
export const getTaskPriorityBadge = (priority: TaskPriority): BadgeConfig => {
  const configs: Record<TaskPriority, BadgeConfig> = {
    low: {
      variant: 'outline',
      className: 'bg-muted text-muted-foreground border-border font-semibold',
      label: 'Low',
    },
    medium: {
      variant: 'outline',
      className: getStatusClasses('info'),
      label: 'Medium',
    },
    high: {
      variant: 'outline',
      className: getStatusClasses('warning'),
      label: 'High',
    },
    urgent: {
      variant: 'outline',
      className: 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/50',
      label: 'Urgent',
    },
    critical: {
      variant: 'destructive',
      className: '',
      label: 'Critical',
    },
  }
  return configs[priority]
}

// ============================================================================
// HELPER: DERIVE CLASSIFICATION FROM IMPORTANCE SCORE
// ============================================================================

/**
 * Derives noise classification from importance score
 * Used when noise_classification field is missing
 */
export const getClassificationFromScore = (score: number): NoiseClassification => {
  if (score < 0.3) return 'noise'
  if (score < 0.7) return 'weak_signal'
  return 'signal'
}
