/**
 * NotificationBadge Component
 *
 * Reusable badge for displaying notification counts.
 * Supports adaptive sizing for large numbers and auto-caps at 999+.
 */

import { cn } from '@/shared/lib/utils'

interface NotificationBadgeProps {
  count: number
  tooltip?: string
  className?: string
}

export function NotificationBadge({ count, tooltip, className }: NotificationBadgeProps) {
  if (!count || count <= 0) return null

  const displayCount = count > 999 ? "999+" : count
  const ariaLabel = tooltip || `${displayCount} notifications`

  return (
    <span
      title={tooltip}
      aria-label={ariaLabel}
      role="status"
      aria-live="polite"
      className={cn(
        "min-w-6 h-6 px-2 flex items-center justify-center",
        "bg-semantic-warning/20 text-semantic-warning",
        "hover:bg-semantic-warning/30 transition-colors",
        "font-semibold rounded-full",
        "border border-semantic-warning/40",
        count > 99 ? "text-[10px]" : "text-xs",
        className
      )}
    >
      {displayCount}
    </span>
  )
}
