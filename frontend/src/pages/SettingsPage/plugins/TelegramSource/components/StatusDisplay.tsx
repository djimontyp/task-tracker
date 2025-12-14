import { Badge } from '@/shared/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'loading'

interface StatusDisplayProps {
  status: ConnectionStatus
  className?: string
  showLabel?: boolean
}

const STATUS_CONFIG = {
  connected: {
    icon: CheckCircle,
    label: 'Connected',
    badgeClass: 'bg-status-connected hover:bg-status-connected/90 text-white border-status-connected',
    iconClass: 'text-white',
  },
  disconnected: {
    icon: XCircle,
    label: 'Disconnected',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    iconClass: 'text-muted-foreground',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    badgeClass: 'bg-semantic-error/10 text-semantic-error border-semantic-error/20',
    iconClass: 'text-semantic-error',
  },
  loading: {
    icon: Loader2,
    label: 'Connecting...',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    iconClass: 'text-muted-foreground animate-spin',
  },
}

export function StatusDisplay({ status, className, showLabel = true }: StatusDisplayProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-2',
        config.badgeClass,
        className
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', config.iconClass)} />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  )
}

export default StatusDisplay
