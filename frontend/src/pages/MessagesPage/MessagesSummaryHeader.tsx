import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/shared/ui'
import { Signal, AlertCircle, Sparkles } from 'lucide-react'

interface SignalNoiseStats {
  signalCount: number
  noiseCount: number
  total: number
  ratio: number
}

interface MessagesSummaryHeaderProps {
  stats: SignalNoiseStats
}

/**
 * Returns time-based greeting key based on current hour.
 * Morning: 5-11, Afternoon: 12-17, Evening: 18-4
 */
function getGreetingKey(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'evening'
}

/**
 * Humanized summary header for Messages page.
 * Shows friendly greeting with today's signal stats.
 */
export function MessagesSummaryHeader({ stats }: MessagesSummaryHeaderProps) {
  const { t } = useTranslation('messages')

  const greetingKey = useMemo(() => getGreetingKey(), [])

  // Calculate items needing attention (e.g., high importance signals not yet processed)
  // For now, use noise count as proxy for "needs attention"
  const needsAttention = stats.noiseCount

  // Determine which summary to show
  const hasSummary = stats.total > 0
  const hasSignals = stats.signalCount > 0
  const hasAttention = needsAttention > 0

  if (!hasSummary) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-base">{t(`summary.greeting.${greetingKey}`)}</span>
        <span className="text-base">{t('summary.noMessages')}</span>
        {/* eslint-disable-next-line local-rules/no-hardcoded-text */}
        <span className="text-lg" aria-hidden="true">
          ☕️
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      {/* Greeting */}
      <span className="text-base font-medium">{t(`summary.greeting.${greetingKey}`)}</span>

      {/* Today's summary */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{t('summary.today')}:</span>

        {hasSignals && (
          <Badge variant="secondary" className="gap-2">
            <Signal className="h-3.5 w-3.5 text-status-connected" />
            <span>{t('summary.newSignals', { count: stats.signalCount })}</span>
          </Badge>
        )}

        {hasAttention && (
          <Badge variant="outline" className="gap-2 border-semantic-warning text-semantic-warning">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{t('summary.needsAttention', { count: needsAttention })}</span>
          </Badge>
        )}

        {!hasSignals && !hasAttention && (
          <Badge variant="secondary" className="gap-2">
            <Sparkles className="h-3.5 w-3.5 text-status-connected" />
            <span>{t('summary.allClear')}</span>
            <span aria-hidden="true">
              ✨
            </span>
          </Badge>
        )}
      </div>
    </div>
  )
}
