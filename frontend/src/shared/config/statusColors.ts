/**
 * Unified status color system across the application
 * WCAG 2.1 AA compliant (4.5:1 contrast ratio)
 */

export type StatusVariant = 'info' | 'success' | 'warning' | 'error'

export const STATUS_COLORS = {
  info: {
    bg: 'bg-semantic-info/10',
    text: 'text-semantic-info',
    border: 'border-semantic-info/50',
    badgeVariant: 'outline' as const,
  },
  success: {
    bg: 'bg-semantic-success/10',
    text: 'text-semantic-success',
    border: 'border-semantic-success/50',
    badgeVariant: 'default' as const,
  },
  warning: {
    bg: 'bg-semantic-warning/10',
    text: 'text-semantic-warning',
    border: 'border-semantic-warning/50',
    badgeVariant: 'outline' as const,
  },
  error: {
    bg: 'bg-semantic-error/10',
    text: 'text-semantic-error',
    border: 'border-semantic-error/50',
    badgeVariant: 'destructive' as const,
  },
} as const

export const getStatusClasses = (variant: StatusVariant): string => {
  const config = STATUS_COLORS[variant]
  return `${config.bg} ${config.text} ${config.border}`
}

export const getStatusBadgeVariant = (variant: StatusVariant) => {
  return STATUS_COLORS[variant].badgeVariant
}
