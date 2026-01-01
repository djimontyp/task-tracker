import { Badge } from '@/shared/ui/badge'
import { ShieldCheck, User } from 'lucide-react'
import { cn } from '@/shared/lib/index'

export interface AdminBadgeProps {
  isAdminMode: boolean
  className?: string
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({
  isAdminMode,
  className,
}) => {
  const Icon = isAdminMode ? ShieldCheck : User
  const label = isAdminMode ? 'Admin' : 'User'

  return (
    <Badge
      className={cn(
        'flex items-center gap-2 whitespace-nowrap px-4 py-2 text-xs font-semibold border border-border/60 bg-card/80 text-foreground transition-colors',
        'hover:bg-accent/15 hover:text-foreground',
        isAdminMode && 'bg-semantic-warning/15 text-semantic-warning border-semantic-warning hover:bg-semantic-warning/25',
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
