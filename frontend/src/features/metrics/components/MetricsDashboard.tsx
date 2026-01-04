import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart3,
  CheckCircle,
  Cpu,
  Signal,
  SignalLow,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { MetricCard } from '@/shared/components/MetricCard'
import { AdminFeatureBadge } from '@/shared/components'
import { metricsService } from '../api/metricsService'
import { QualityScoreDisplay } from './QualityScoreDisplay'
import { NoiseStatsDisplay } from './NoiseStatsDisplay'
import { useAdminMode } from '@/shared/hooks/useAdminMode'
import { useWebSocket } from '@/shared/hooks'
import { cn } from '@/shared/lib'
import { toast } from 'sonner'
import { isMetricsEvent, type MetricsUpdateEvent } from '@/shared/types/websocket'

const POLLING_FALLBACK_INTERVAL = 30000

interface MetricThreshold {
  metric: string
  critical: number
  warning: number
  optimal: number
}

const THRESHOLDS: MetricThreshold[] = [
  {
    metric: 'topicQualityScore',
    critical: 40,
    warning: 70,
    optimal: 71,
  },
  {
    metric: 'noiseRatio',
    critical: 40,
    warning: 20,
    optimal: 20,
  },
  {
    metric: 'classificationAccuracy',
    critical: 70,
    warning: 85,
    optimal: 85,
  },
]

type MetricStatus = 'critical' | 'warning' | 'optimal'

interface CriticalMetric {
  name: string
  value: number | string
  status: MetricStatus
}

const getMetricStatus = (metric: string, value: number): MetricStatus => {
  const threshold = THRESHOLDS.find((t) => t.metric === metric)
  if (!threshold) return 'optimal'

  if (metric === 'noiseRatio') {
    if (value > threshold.critical) return 'critical'
    if (value > threshold.warning) return 'warning'
  } else {
    if (value < threshold.critical) return 'critical'
    if (value < threshold.warning) return 'warning'
  }

  return 'optimal'
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

const getStatusBadgeLabel = (status: MetricStatus, t: (key: string) => string): string => {
  switch (status) {
    case 'critical':
      return t('metricsDashboard.status.critical')
    case 'warning':
      return t('metricsDashboard.status.warning')
    case 'optimal':
      return t('metricsDashboard.status.good')
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

const mapTrendDirection = (
  direction: 'up' | 'down' | 'stable'
): 'up' | 'down' | 'neutral' => {
  return direction === 'stable' ? 'neutral' : direction
}

const NOTIFICATION_STORAGE_KEY = 'metrics-notifications-shown'

export const MetricsDashboard = () => {
  const { t } = useTranslation('monitoring')
  const { isAdminMode } = useAdminMode()
  const queryClient = useQueryClient()
  const [usePolling, setUsePolling] = useState(false)
  const [alertDismissed, setAlertDismissed] = useState(false)

  // WebSocket connection for real-time updates
  const { isConnected: isWsConnected, connectionState } = useWebSocket({
    topics: ['metrics'],
    onMessage: (data: unknown) => {
      if (isMetricsEvent(data as MetricsUpdateEvent)) {
        const event = data as MetricsUpdateEvent
        if (event.data) {
          queryClient.setQueryData(['metrics', 'dashboard'], event.data)
        }
      }
    },
    onConnect: () => {
      // WebSocket connected - disable polling
      setUsePolling(false)
    },
    onDisconnect: () => {
      // WebSocket disconnected - fallback to polling
      setUsePolling(true)
    },
  })

  const {
    data: metrics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['metrics', 'dashboard'],
    queryFn: () => metricsService.fetchDashboardMetrics(),
    // Only poll when WebSocket is disconnected
    refetchInterval: usePolling || !isWsConnected ? POLLING_FALLBACK_INTERVAL : false,
    enabled: isAdminMode,
  })

  useEffect(() => {
    if (!metrics) return

    const shownNotifications = JSON.parse(
      localStorage.getItem(NOTIFICATION_STORAGE_KEY) || '{}'
    )

    const topicQualityStatus = getMetricStatus('topicQualityScore', metrics.topicQualityScore)
    const noiseRatioStatus = getMetricStatus('noiseRatio', metrics.noiseRatio)
    const accuracyStatus = getMetricStatus('classificationAccuracy', metrics.classificationAccuracy)

    if (topicQualityStatus === 'critical' && !shownNotifications.topicQualityScore) {
      toast.error(t('metricsDashboard.toast.topicQuality.title'), {
        description: t('metricsDashboard.toast.topicQuality.description', { score: metrics.topicQualityScore }),
        duration: 10000,
      })
      shownNotifications.topicQualityScore = true
    } else if (topicQualityStatus !== 'critical' && shownNotifications.topicQualityScore) {
      delete shownNotifications.topicQualityScore
    }

    if (noiseRatioStatus === 'critical' && !shownNotifications.noiseRatio) {
      toast.warning(t('metricsDashboard.toast.noiseRatio.title'), {
        description: t('metricsDashboard.toast.noiseRatio.description', { ratio: metrics.noiseRatio }),
        duration: 10000,
      })
      shownNotifications.noiseRatio = true
    } else if (noiseRatioStatus !== 'critical' && shownNotifications.noiseRatio) {
      delete shownNotifications.noiseRatio
    }

    if (accuracyStatus === 'critical' && !shownNotifications.classificationAccuracy) {
      toast.error(t('metricsDashboard.toast.classificationAccuracy.title'), {
        description: t('metricsDashboard.toast.classificationAccuracy.description', { accuracy: metrics.classificationAccuracy }),
        duration: 10000,
      })
      shownNotifications.classificationAccuracy = true
    } else if (accuracyStatus !== 'critical' && shownNotifications.classificationAccuracy) {
      delete shownNotifications.classificationAccuracy
    }

    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(shownNotifications))
  }, [metrics, t])

  if (!isAdminMode) {
    return null
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-4 flex items-center justify-between">
          <span className="text-destructive">{t('metricsDashboard.loadingError', { error: String(error) })}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t('metricsDashboard.retry')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('metricsDashboard.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) {
    return null
  }

  const totalMessages = 1000
  const noisyMessages = Math.round((metrics.noiseRatio / 100) * totalMessages)

  const criticalMetrics: CriticalMetric[] = []

  const topicQualityStatus = getMetricStatus('topicQualityScore', metrics.topicQualityScore)
  const noiseRatioStatus = getMetricStatus('noiseRatio', metrics.noiseRatio)
  const accuracyStatus = getMetricStatus('classificationAccuracy', metrics.classificationAccuracy)

  if (topicQualityStatus === 'critical') {
    criticalMetrics.push({
      name: t('metricsDashboard.metrics.topicQualityScore.title'),
      value: `${metrics.topicQualityScore}/100`,
      status: 'critical',
    })
  }

  if (noiseRatioStatus === 'critical') {
    criticalMetrics.push({
      name: t('noiseStats.title'),
      value: `${metrics.noiseRatio}%`,
      status: 'critical',
    })
  }

  if (accuracyStatus === 'critical') {
    criticalMetrics.push({
      name: t('metricsDashboard.metrics.classificationAccuracy.title'),
      value: `${metrics.classificationAccuracy}%`,
      status: 'critical',
    })
  }

  const hasCriticalMetrics = criticalMetrics.length > 0 && !alertDismissed

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">{t('metricsDashboard.title')}</h2>
          <AdminFeatureBadge variant="inline" size="sm" />
        </div>
        <div className="flex items-center gap-4">
          {isWsConnected ? (
            <>
              <Badge variant="outline" className="gap-2 border-status-connected text-status-connected">
                <Signal className="w-3.5 h-3.5" />
                {t('metricsDashboard.connection.live')}
              </Badge>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-status-connected animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  {t('metricsDashboard.connection.realTimeUpdates')}
                </span>
              </div>
            </>
          ) : (
            <>
              <Badge variant="outline" className="gap-2 border-status-validating text-status-validating">
                <SignalLow className="w-3.5 h-3.5" />
                {t('metricsDashboard.connection.polling')}
              </Badge>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-status-validating animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  {connectionState === 'reconnecting' ? t('metricsDashboard.connection.reconnecting') : t('metricsDashboard.connection.autoRefresh')}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {hasCriticalMetrics && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('metricsDashboard.criticalAlert.title')}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 mt-2 space-y-2">
              {criticalMetrics.map((metric) => (
                <li key={metric.name}>
                  <span className="font-medium">{metric.name}:</span> {metric.value} ({t('metricsDashboard.status.critical')})
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAlertDismissed(true)}
                className="bg-background"
              >
                {t('metricsDashboard.criticalAlert.dismiss')}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div
        className={cn(
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
          'animate-fade-in-up'
        )}
        role="region"
        aria-label={t('metricsDashboard.ariaLabel')}
      >
        <Card
          className={cn(
            'relative',
            getCardBorderColor(topicQualityStatus),
            topicQualityStatus === 'critical' && 'animate-pulse'
          )}
        >
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('metricsDashboard.metrics.topicQualityScore.title')}
                  </p>
                </div>
                <Badge
                  variant={getStatusBadgeVariant(topicQualityStatus)}
                  className={cn('text-xs', getStatusBadgeColor(topicQualityStatus))}
                >
                  {getStatusBadgeLabel(topicQualityStatus, t)}
                </Badge>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">
                  {metrics.topicQualityScore}
                </span>
                <QualityScoreDisplay
                  score={metrics.topicQualityScore}
                  showTooltip={true}
                />
              </div>
              {metrics.trends.topicQualityScore.direction !== 'stable' && (
                <p className="text-sm text-muted-foreground">
                  {t('metricsDashboard.trend.vsLastWeek', {
                    direction: metrics.trends.topicQualityScore.direction === 'up' ? '↑' : '↓',
                    change: Math.abs(metrics.trends.topicQualityScore.change).toFixed(1)
                  })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <NoiseStatsDisplay
          totalMessages={totalMessages}
          noisyMessages={noisyMessages}
          noiseRatio={metrics.noiseRatio}
          trendData={[15, 18, 22, 19, 16, 14, metrics.noiseRatio]}
          status={noiseRatioStatus}
        />

        <MetricCard
          title={t('metricsDashboard.metrics.classificationAccuracy.title')}
          value={`${metrics.classificationAccuracy}%`}
          subtitle={t('metricsDashboard.metrics.classificationAccuracy.subtitle')}
          trend={{
            value: Math.abs(metrics.trends.classificationAccuracy.change),
            direction: mapTrendDirection(metrics.trends.classificationAccuracy.direction),
          }}
          icon={CheckCircle}
          iconColor="text-semantic-success"
          status={accuracyStatus}
        />

        <MetricCard
          title={t('metricsDashboard.metrics.activeAnalysisRuns.title')}
          value={metrics.activeAnalysisRuns}
          subtitle={t('metricsDashboard.metrics.activeAnalysisRuns.subtitle')}
          trend={{
            value: Math.abs(metrics.trends.activeAnalysisRuns.change),
            direction: mapTrendDirection(metrics.trends.activeAnalysisRuns.direction),
          }}
          icon={Cpu}
          iconColor="text-semantic-info"
        />
      </div>
    </div>
  )
}
