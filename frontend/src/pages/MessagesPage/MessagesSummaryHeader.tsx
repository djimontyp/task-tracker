import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button } from '@/shared/ui'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Signal, AlertCircle, Sparkles, HelpCircle } from 'lucide-react'

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

  // Legend Content Component
  const LegendContent = (
    <PopoverContent className="w-64 p-3" align="end">
      <h4 className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground">
        {t('legend.title', 'Signal Quality')}
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-red-500 rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
          <span className="font-medium">Critical Signal</span>
          <span className="ml-auto text-xs text-muted-foreground">&gt;80</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-yellow-500 rounded-sm shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
          <span className="font-medium">Medium Signal</span>
          <span className="ml-auto text-xs text-muted-foreground">&gt;50</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-green-500 rounded-sm shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
          <span className="font-medium">Valid Signal</span>
          <span className="ml-auto text-xs text-muted-foreground">Base</span>
        </div>
        <div className="flex items-center gap-3 opacity-60">
          <div className="w-1.5 h-4 bg-muted-foreground/20 rounded-sm" />
          <span>Noise / Low Info</span>
        </div>
      </div>
    </PopoverContent>
  )

  return (
    <div className="flex items-center gap-4 w-full">
      {/* Greeting */}
      <span className="text-base font-medium">{t(`summary.greeting.${greetingKey}`)}</span>

      {/* Today's summary - Clickable for Legend */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" title={t('summary.legendHint', 'Click to see Signal Quality Legend')}>
            <span className="text-muted-foreground select-none">{t('summary.today')}:</span>

            {hasSignals && (
              <Badge variant="secondary" className="gap-2 bg-secondary/80 hover:bg-secondary">
                <Signal className="h-3.5 w-3.5 text-status-connected" />
                <span>{t('summary.newSignals', { count: stats.signalCount })}</span>
              </Badge>
            )}

            {hasAttention && (
              <Badge variant="outline" className="gap-2 border-semantic-warning text-semantic-warning bg-semantic-warning/5 hover:bg-semantic-warning/10">
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
        </PopoverTrigger>
        {LegendContent}
      </Popover>

      {/* Legend / Help (Secondary Access) */}
      <div className="ml-auto">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-8 px-2 hover:bg-muted/50">
              <HelpCircle className="h-4 w-4" />
              <span className="text-xs font-medium hidden sm:inline">{t('summary.legend', 'Legend')}</span>
            </Button>
          </PopoverTrigger>
          {LegendContent}
        </Popover>
      </div>
    </div>
  )
}
