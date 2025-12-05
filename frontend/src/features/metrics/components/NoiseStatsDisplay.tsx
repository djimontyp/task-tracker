import { useMemo } from 'react'
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

const getNoiseStatus = (noiseRatio: number): string => {
  if (noiseRatio <= 20) return 'Low'
  if (noiseRatio <= 40) return 'Moderate'
  return 'High'
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

const getStatusBadgeLabel = (status: MetricStatus): string => {
  switch (status) {
    case 'critical':
      return 'Critical'
    case 'warning':
      return 'Warning'
    case 'optimal':
      return 'Good'
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
            Noise Filtering
          </CardTitle>
          <Badge
            variant={getStatusBadgeVariant(status)}
            className={cn('text-xs', getStatusBadgeColor(status))}
          >
            {getStatusBadgeLabel(status)}
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
              {getNoiseStatus(noiseRatio)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {noisyMessages.toLocaleString()} of {totalMessages.toLocaleString()} messages filtered
          </p>
        </div>

        {trendDirection && trendDirection !== 'stable' && (
          <div
            className={cn(
              'flex items-center gap-2 text-sm font-medium',
              trendDirection === 'up' ? 'text-semantic-error' : 'text-semantic-success'
            )}
            aria-label={`Noise ratio ${trendDirection === 'up' ? 'increased' : 'decreased'} by ${trendChange.toFixed(1)}%`}
          >
            {trendDirection === 'up' ? (
              <ArrowUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ArrowDown className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{trendChange.toFixed(1)}% vs yesterday</span>
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
                  title={`Day ${index + 1}: ${value.toFixed(1)}%`}
                  aria-label={`Day ${index + 1}: ${value.toFixed(1)}% noise ratio`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Last 7 days trend
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
