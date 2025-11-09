import { Badge } from '@/shared/ui/badge'
import { ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline'
import { cn } from '@/shared/lib/index'

export interface AdminBadgeProps {
  isAdminMode: boolean
  className?: string
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({
  isAdminMode,
  className,
}) => {
  const Icon = isAdminMode ? ShieldCheckIcon : UserIcon
  const label = isAdminMode ? 'Admin' : 'User'

  return (
    <Badge
      className={cn(
        'flex items-center gap-2 whitespace-nowrap px-3 py-1.5 text-xs font-semibold border border-border/60 bg-card/80 text-foreground transition-colors',
        'hover:bg-accent/15 hover:text-foreground',
        isAdminMode && 'bg-amber-500/15 text-amber-400 border-amber-400 hover:bg-amber-500/25',
        className
      )}
      role="status"
      aria-label={isAdminMode ? 'Admin Mode' : 'User Mode'}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </Badge>
  )
}
