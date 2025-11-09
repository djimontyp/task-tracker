/**
 * Unified status color system across the application
 * WCAG 2.1 AA compliant (4.5:1 contrast ratio)
 */

export type StatusVariant = 'info' | 'success' | 'warning' | 'error'

export const STATUS_COLORS = {
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500/50',
    badgeVariant: 'outline' as const,
  },
  success: {
    bg: 'bg-green-500/10',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-500/50',
    badgeVariant: 'default' as const,
  },
  warning: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-500/50',
    badgeVariant: 'outline' as const,
  },
  error: {
    bg: 'bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-500/50',
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
