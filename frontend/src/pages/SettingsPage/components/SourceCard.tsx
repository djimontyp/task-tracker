import { useTranslation } from 'react-i18next'
import { Button, Card, CardContent, CardHeader, Switch } from '@/shared/ui'
import { AlertCircle, RefreshCw } from 'lucide-react'
import type { ComponentType } from 'react'

export interface SourceCardProps {
  icon: ComponentType<{ className?: string }>
  name: string
  description: string
  enabled: boolean
  onToggle: () => void
  onSettings: () => void
  isError?: boolean
  error?: Error
  onRetry?: () => void
}

const SourceCard = ({
  icon: Icon,
  name,
  description,
  enabled,
  onToggle,
  onSettings,
  isError = false,
  error,
  onRetry,
}: SourceCardProps) => {
  const { t } = useTranslation('settings')

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('sourceCard.error.title', 'Failed to load')}</p>
              {error && <p className="text-xs text-muted-foreground">{error.message}</p>}
            </div>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('sourceCard.error.retry', 'Retry')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="space-y-4 pb-4">
        {/* Icon + Title + Toggle row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 shrink-0">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-semibold text-lg leading-tight flex-1 truncate">{name}</h3>
          <Switch checked={enabled} onCheckedChange={onToggle} aria-label={`Toggle ${name}`} />
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
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
