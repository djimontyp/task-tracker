import { Badge, Button, Card, CardContent, CardFooter, CardHeader, Separator, Switch } from '@/shared/ui'
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react'
import type { ComponentType } from 'react'

export interface SourceCardProps {
  icon: ComponentType<{ className?: string }>
  name: string
  description: string
  status: 'active' | 'inactive' | 'not-configured' | 'error'
  statusLabel?: string
  enabled: boolean
  onToggle: () => void
  onSettings: () => void
}

const statusConfig = {
  active: {
    icon: CheckCircle,
    color: 'text-status-connected',
    badge: 'border-status-connected bg-status-connected/10 text-status-connected',
  },
  inactive: {
    icon: AlertCircle,
    color: 'text-muted-foreground',
    badge: 'border-muted-foreground bg-muted text-muted-foreground',
  },
  'not-configured': {
    icon: Clock,
    color: 'text-status-pending',
    badge: 'border-status-pending bg-status-pending/10 text-status-pending',
  },
  error: {
    icon: XCircle,
    color: 'text-destructive',
    badge: 'border-destructive bg-destructive/10 text-destructive',
  },
} as const

const SourceCard = ({
  icon: Icon,
  name,
  description,
  status,
  statusLabel,
  enabled,
  onToggle,
  onSettings,
}: SourceCardProps) => {
  const badgeText = statusLabel || (status === 'active' ? 'Active' : status === 'inactive' ? 'Inactive' : 'Setup needed')

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="flex-row items-start gap-4 space-y-0 pb-4">
        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg leading-none">{name}</h3>
            <div className="flex items-center gap-2">
              {(() => {
                const StatusIcon = statusConfig[status].icon
                return <StatusIcon className={`h-4 w-4 ${statusConfig[status].color}`} />
              })()}
              <Badge
                variant="outline"
                className={`text-xs ${statusConfig[status].badge}`}
              >
                {badgeText}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
      </CardContent>

      <Separator />

      <CardFooter className="flex items-center justify-between pt-4">
        <Button variant="ghost" size="sm" onClick={onSettings}>
          Settings
        </Button>
        <Switch checked={enabled} onCheckedChange={onToggle} aria-label={`Toggle ${name}`} />
      </CardFooter>
    </Card>
  )
}

export default SourceCard
