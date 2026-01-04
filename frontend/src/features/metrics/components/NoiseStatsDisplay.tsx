import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib'
import type { NoiseStatsProps } from '../types'

type MetricStatus = 'critical' | 'warning' | 'optimal'

const getNoiseColor = (noiseRatio: number): string => {
  if (noiseRatio <= 20) return 'text-semantic-success'
  if (noiseRatio <= 40) return 'text-semantic-warning'
  return 'text-semantic-error'
}

const getNoiseStatusKey = (noiseRatio: number): string => {
  if (noiseRatio <= 20) return 'noiseStats.status.low'
  if (noiseRatio <= 40) return 'noiseStats.status.moderate'
  return 'noiseStats.status.high'
}

const getStatusBadgeVariant = (
  status: MetricStatus
): 'default' | 'destructive' | 'secondary' => {
  switch (status) {
    case 'critical':
      return 'destructive'
    case 'warning':
      return 'secondary'
    case 'optimal':
      return 'default'
  }
}

const getStatusBadgeLabelKey = (status: MetricStatus): string => {
  switch (status) {
    case 'critical':
      return 'metricsDashboard.status.critical'
    case 'warning':
      return 'metricsDashboard.status.warning'
    case 'optimal':
      return 'metricsDashboard.status.good'
  }
}

const getStatusBadgeColor = (status: MetricStatus): string => {
  switch (status) {
    case 'critical':
      return 'border-status-error text-status-error bg-status-error/10'
    case 'warning':
      return 'border-status-validating text-status-validating bg-status-validating/10'
    case 'optimal':
      return 'border-status-connected text-status-connected bg-status-connected/10'
  }
}

const getCardBorderColor = (status: MetricStatus): string => {
  switch (status) {
    case 'critical':
      return 'border-status-error'
    case 'warning':
      return 'border-status-validating'
    case 'optimal':
      return 'border-status-connected/30'
  }
}

export interface NoiseStatsDisplayProps extends NoiseStatsProps {
  status?: MetricStatus
}

export const NoiseStatsDisplay = ({
  totalMessages,
  noisyMessages,
  noiseRatio,
  trendData,
  status = 'optimal',
}: NoiseStatsDisplayProps) => {
  const { t } = useTranslation('monitoring')

  const trendDirection = useMemo(() => {
    if (!trendData || trendData.length < 2) return null
    const recent = trendData[trendData.length - 1]
    const previous = trendData[trendData.length - 2]
    if (recent > previous) return 'up'
    if (recent < previous) return 'down'
    return 'stable'
  }, [trendData])

  const trendChange = useMemo(() => {
    if (!trendData || trendData.length < 2) return 0
    const recent = trendData[trendData.length - 1]
    const previous = trendData[trendData.length - 2]
    return Math.abs(recent - previous)
  }, [trendData])

  return (
    <Card
      className={cn(
        'h-full relative',
        getCardBorderColor(status),
        status === 'critical' && 'animate-pulse'
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('noiseStats.title')}
          </CardTitle>
          <Badge
            variant={getStatusBadgeVariant(status)}
            className={cn('text-xs', getStatusBadgeColor(status))}
          >
            {t(getStatusBadgeLabelKey(status))}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className={cn('text-3xl font-bold', getNoiseColor(noiseRatio))}>
              {noiseRatio.toFixed(1)}%
            </span>
            <span className={cn('text-sm font-medium', getNoiseColor(noiseRatio))}>
              {t(getNoiseStatusKey(noiseRatio))}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('noiseStats.messagesFiltered', { noisy: noisyMessages.toLocaleString(), total: totalMessages.toLocaleString() })}
          </p>
        </div>

        {trendDirection && trendDirection !== 'stable' && (
          <div
            className={cn(
              'flex items-center gap-2 text-sm font-medium',
              trendDirection === 'up' ? 'text-semantic-error' : 'text-semantic-success'
            )}
            aria-label={t('noiseStats.trend.ariaLabel', { direction: trendDirection === 'up' ? 'increased' : 'decreased', change: trendChange.toFixed(1) })}
          >
            {trendDirection === 'up' ? (
              <ArrowUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ArrowDown className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{t('noiseStats.trend.vsYesterday', { change: trendChange.toFixed(1) })}</span>
          </div>
        )}

        {trendData && trendData.length > 0 && (
          <div className="pt-2">
            <div className="flex items-end justify-between h-12 gap-2">
              {trendData.map((value, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex-1 rounded-t transition-all',
                    getNoiseColor(value).replace('text-', 'bg-').replace('-600', '-200')
                  )}
                  style={{ height: `${(value / 100) * 100}%` }}
                  title={t('noiseStats.chart.dayLabel', { day: index + 1, value: value.toFixed(1) })}
                  aria-label={t('noiseStats.chart.dayLabel', { day: index + 1, value: value.toFixed(1) })}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {t('noiseStats.chart.legend')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
