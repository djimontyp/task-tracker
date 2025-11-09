import { Badge } from '@/shared/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import { ShieldCheckIcon } from '@heroicons/react/24/solid'
import { cn } from '@/shared/lib/utils'
import { useUiStore } from '@/shared/store/uiStore'

export interface AdminFeatureBadgeProps {
  variant?: 'inline' | 'floating'
  size?: 'sm' | 'default' | 'lg'
  text?: string
  tooltip?: string
  className?: string
  showIcon?: boolean
}

export const AdminFeatureBadge: React.FC<AdminFeatureBadgeProps> = ({
  variant = 'inline',
  size = 'default',
  text = 'Admin Only',
  tooltip = 'This feature is only available in Admin Mode',
  className,
  showIcon = true,
}) => {
  const isAdminMode = useUiStore((state) => state.isAdminMode)

  if (!isAdminMode) return null

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    default: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-3 w-3',
    lg: 'h-4 w-4',
  }

  const badgeClasses = cn(
    'inline-flex items-center gap-1',
    'bg-amber-500/90 hover:bg-amber-600 text-white border-amber-500',
    'font-medium shadow-sm',
    variant === 'floating' && 'absolute top-2 right-2 z-10',
    variant === 'inline' && 'ml-2',
    sizeClasses[size],
    className
  )

  const badge = (
    <Badge
      variant="secondary"
      className={badgeClasses}
      role="status"
      aria-label="Admin only feature"
    >
      {showIcon && (
        <ShieldCheckIcon className={cn(iconSizes[size], 'flex-shrink-0')} aria-hidden="true" />
      )}
      <span>{text}</span>
    </Badge>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
