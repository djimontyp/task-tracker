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
  totalMessages?: number
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
export function MessagesSummaryHeader({ stats, totalMessages }: MessagesSummaryHeaderProps) {
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
    <PopoverContent className="w-80 p-0 overflow-hidden shadow-lg border-border/60" align="end">
      <div className="bg-muted/30 px-4 py-3 border-b border-border/40">
        <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
          {t('legend.title')}
        </h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {t('legend.subtitle')}
        </p>
      </div>
      <div className="p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-status-error shadow-[0_0_8px_hsl(var(--status-error)/0.4)] mt-2 shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t('legend.levels.critical.label')}</span>
                <span className="text-[10px] font-mono bg-status-error/10 text-status-error px-2 rounded-sm">{t('legend.levels.critical.score')}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                {t('legend.levels.critical.description')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-status-pending shadow-[0_0_8px_hsl(var(--status-pending)/0.4)] mt-2 shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t('legend.levels.medium.label')}</span>
                <span className="text-[10px] font-mono bg-status-pending/10 text-status-pending px-2 rounded-sm">{t('legend.levels.medium.score')}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                {t('legend.levels.medium.description')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-status-connected shadow-[0_0_8px_hsl(var(--status-connected)/0.4)] mt-2 shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t('legend.levels.valid.label')}</span>
                <span className="text-[10px] font-mono bg-status-connected/10 text-status-connected px-2 rounded-sm">{t('legend.levels.valid.score')}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                {t('legend.levels.valid.description')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 opacity-60">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-2 shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t('legend.levels.noise.label')}</span>
                <span className="text-[10px] font-mono bg-muted px-2 rounded-sm">{t('legend.levels.noise.score')}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                {t('legend.levels.noise.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PopoverContent>
  )

  return (
    <div className="flex items-center gap-4 w-full">
      {/* Greeting */}
      <span className="text-base font-medium">{t(`summary.greeting.${greetingKey}`)}</span>

      {/* Total messages count */}
      {totalMessages !== undefined && totalMessages > 0 && (
        <span className="text-sm text-muted-foreground">
          {t('summary.totalMessages', { count: totalMessages })}
        </span>
      )}

      {/* Today's summary - Clickable for Legend */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" title={t('summary.legendHint')}>
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
              <span className="text-xs font-medium hidden sm:inline">{t('summary.legend')}</span>
            </Button>
          </PopoverTrigger>
          {LegendContent}
        </Popover>
      </div>
    </div>
  )
}
