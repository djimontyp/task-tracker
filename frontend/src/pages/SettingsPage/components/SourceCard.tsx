import { Button, Card, CardContent, CardHeader, Switch } from '@/shared/ui'
import type { ComponentType } from 'react'

export interface SourceCardProps {
  icon: ComponentType<{ className?: string }>
  name: string
  description: string
  enabled: boolean
  onToggle: () => void
  onSettings: () => void
}

const SourceCard = ({
  icon: Icon,
  name,
  description,
  enabled,
  onToggle,
  onSettings,
}: SourceCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="space-y-4 pb-4">
        {/* Icon + Title + Toggle row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 shrink-0">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-semibold text-lg leading-tight flex-1">{name}</h3>
          <Switch checked={enabled} onCheckedChange={onToggle} aria-label={`Toggle ${name}`} />
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>

      <CardContent className="pt-0">
        <Button variant="outline" size="sm" onClick={onSettings}>
          Settings
        </Button>
      </CardContent>
    </Card>
  )
}

export default SourceCard
