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

const statusColors = {
  active: 'bg-green-500',
  inactive: 'bg-gray-400',
  'not-configured': 'bg-yellow-500',
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
              <div className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
              <Badge
                variant="outline"
                className={`text-xs ${status === 'active' ? 'border-green-600 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 dark:border-green-800' : ''} ${status === 'inactive' ? 'border-gray-400 bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-400' : ''} ${status === 'not-configured' ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : ''}`}
              >
                {badgeText}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
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
