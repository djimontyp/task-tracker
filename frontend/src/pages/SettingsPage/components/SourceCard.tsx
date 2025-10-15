import { Badge, Button, Card, CardContent, CardFooter, CardHeader, Separator, Switch } from '@/shared/ui'
import type { ComponentType } from 'react'

export interface SourceCardProps {
  icon: ComponentType<{ className?: string }>
  name: string
  description: string
  status: 'active' | 'inactive' | 'not-configured'
  statusLabel?: string
  enabled: boolean
  onToggle: () => void
  onSettings: () => void
}

const statusVariants = {
  active: 'default',
  inactive: 'secondary',
  'not-configured': 'outline',
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
  const badgeText = statusLabel || (status === 'active' ? 'Active' : status === 'inactive' ? 'Inactive' : 'Not configured')

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="flex-row items-start gap-4 space-y-0 pb-4">
        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg leading-none mb-2">{name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <Badge variant={statusVariants[status]} className="text-xs">
          {badgeText}
        </Badge>
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
