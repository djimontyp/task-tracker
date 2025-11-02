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
  return (
    <Badge
      variant={isAdminMode ? 'default' : 'secondary'}
      className={cn(
        'flex items-center gap-1',
        isAdminMode && 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500',
        className
      )}
      role="status"
      aria-label={isAdminMode ? 'Admin Mode' : 'Consumer Mode'}
    >
      {isAdminMode ? (
        <>
          <ShieldCheckIcon className="h-3 w-3" aria-hidden="true" />
          <span>Admin Mode</span>
        </>
      ) : (
        <>
          <UserIcon className="h-3 w-3" aria-hidden="true" />
          <span>Consumer Mode</span>
        </>
      )}
    </Badge>
  )
}
