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

  return (
    <span
      title={tooltip}
      className={cn(
        "min-w-6 h-6 px-2 flex items-center justify-center",
        "bg-orange-200 text-orange-900 dark:bg-orange-950 dark:text-orange-100",
        "hover:bg-orange-300 dark:hover:bg-orange-900 transition-colors",
        "font-semibold rounded-full",
        "border border-orange-400 dark:border-orange-800",
        count > 99 ? "text-[10px]" : "text-xs",
        className
      )}
    >
      {count > 999 ? "999+" : count}
    </span>
  )
}
