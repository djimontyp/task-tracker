import { useMemo } from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib'
import type { NoiseStatsProps } from '../types'

type MetricStatus = 'critical' | 'warning' | 'optimal'

const getNoiseColor = (noiseRatio: number): string => {
  if (noiseRatio <= 20) return 'text-green-600'
  if (noiseRatio <= 40) return 'text-yellow-600'
  return 'text-red-600'
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
      return 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950'
    case 'warning':
      return 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950'
    case 'optimal':
      return 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950'
  }
}

const getCardBorderColor = (status: MetricStatus): string => {
  switch (status) {
    case 'critical':
      return 'border-red-500'
    case 'warning':
      return 'border-yellow-500'
    case 'optimal':
      return 'border-green-500/30'
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
      <CardContent className="space-y-3">
        <div className="space-y-1">
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
              'flex items-center gap-1 text-sm font-medium',
              trendDirection === 'up' ? 'text-red-600' : 'text-green-600'
            )}
            aria-label={`Noise ratio ${trendDirection === 'up' ? 'increased' : 'decreased'} by ${trendChange.toFixed(1)}%`}
          >
            {trendDirection === 'up' ? (
              <ArrowUpIcon className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ArrowDownIcon className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{trendChange.toFixed(1)}% vs yesterday</span>
          </div>
        )}

        {trendData && trendData.length > 0 && (
          <div className="pt-2">
            <div className="flex items-end justify-between h-12 gap-1">
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
            <p className="text-xs text-muted-foreground text-center mt-1">
              Last 7 days trend
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
