import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChartBarIcon,
  CheckCircleIcon,
  CpuChipIcon,
  SignalIcon,
  SignalSlashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import MetricCard from '@/shared/components/MetricCard'
import { AdminFeatureBadge } from '@/shared/components'
import { metricsService } from '../api/metricsService'
import { QualityScoreDisplay } from './QualityScoreDisplay'
import { NoiseStatsDisplay } from './NoiseStatsDisplay'
import { useAdminMode } from '@/shared/hooks/useAdminMode'
import { useWebSocket } from '@/features/websocket/hooks/useWebSocket'
import { cn } from '@/shared/lib'
import { toast } from 'sonner'

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

const mapTrendDirection = (
  direction: 'up' | 'down' | 'stable'
): 'up' | 'down' | 'neutral' => {
  return direction === 'stable' ? 'neutral' : direction
}

const NOTIFICATION_STORAGE_KEY = 'metrics-notifications-shown'

export const MetricsDashboard = () => {
  const { isAdminMode } = useAdminMode()
  const queryClient = useQueryClient()
  const [usePolling, setUsePolling] = useState(false)
  const [alertDismissed, setAlertDismissed] = useState(false)

  // WebSocket connection for real-time updates
  const { isConnected: isWsConnected, connectionState } = useWebSocket({
    topics: ['metrics'],
    onMessage: (data: any) => {
      if (data.type === 'metrics:update' && data.data) {
        queryClient.setQueryData(['metrics', 'dashboard'], data.data)
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
      toast.error('Topic Quality Score is Critical', {
        description: `Quality score dropped to ${metrics.topicQualityScore}/100. Review and approve pending topics to improve quality.`,
        duration: 10000,
      })
      shownNotifications.topicQualityScore = true
    } else if (topicQualityStatus !== 'critical' && shownNotifications.topicQualityScore) {
      delete shownNotifications.topicQualityScore
    }

    if (noiseRatioStatus === 'critical' && !shownNotifications.noiseRatio) {
      toast.warning('High Noise Ratio Detected', {
        description: `Over ${metrics.noiseRatio}% of messages are filtered as noise. Consider adjusting classification thresholds.`,
        duration: 10000,
      })
      shownNotifications.noiseRatio = true
    } else if (noiseRatioStatus !== 'critical' && shownNotifications.noiseRatio) {
      delete shownNotifications.noiseRatio
    }

    if (accuracyStatus === 'critical' && !shownNotifications.classificationAccuracy) {
      toast.error('Classification Accuracy is Critical', {
        description: `Accuracy dropped to ${metrics.classificationAccuracy}%. Review classification model and training data.`,
        duration: 10000,
      })
      shownNotifications.classificationAccuracy = true
    } else if (accuracyStatus !== 'critical' && shownNotifications.classificationAccuracy) {
      delete shownNotifications.classificationAccuracy
    }

    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(shownNotifications))
  }, [metrics])

  if (!isAdminMode) {
    return null
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-4 flex items-center justify-between">
          <span className="text-destructive">Failed to load metrics: {String(error)}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">System Metrics</h2>
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
      name: 'Topic Quality Score',
      value: `${metrics.topicQualityScore}/100`,
      status: 'critical',
    })
  }

  if (noiseRatioStatus === 'critical') {
    criticalMetrics.push({
      name: 'Noise Ratio',
      value: `${metrics.noiseRatio}%`,
      status: 'critical',
    })
  }

  if (accuracyStatus === 'critical') {
    criticalMetrics.push({
      name: 'Classification Accuracy',
      value: `${metrics.classificationAccuracy}%`,
      status: 'critical',
    })
  }

  const hasCriticalMetrics = criticalMetrics.length > 0 && !alertDismissed

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">System Metrics</h2>
          <AdminFeatureBadge variant="inline" size="sm" />
        </div>
        <div className="flex items-center gap-3">
          {isWsConnected ? (
            <>
              <Badge variant="outline" className="gap-1.5 border-green-500 text-green-600">
                <SignalIcon className="w-3.5 h-3.5" />
                Live
              </Badge>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  Real-time updates
                </span>
              </div>
            </>
          ) : (
            <>
              <Badge variant="outline" className="gap-1.5 border-yellow-500 text-yellow-600">
                <SignalSlashIcon className="w-3.5 h-3.5" />
                Polling
              </Badge>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  {connectionState === 'reconnecting' ? 'Reconnecting...' : 'Auto-refresh every 30s'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {hasCriticalMetrics && (
        <Alert variant="destructive" className="animate-fade-in">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Critical Metrics Detected</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              {criticalMetrics.map((metric) => (
                <li key={metric.name}>
                  <span className="font-medium">{metric.name}:</span> {metric.value} (Critical)
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
                Dismiss
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
        aria-label="System metrics dashboard"
      >
        <Card
          className={cn(
            'relative',
            getCardBorderColor(topicQualityStatus),
            topicQualityStatus === 'critical' && 'animate-pulse'
          )}
        >
          <CardContent className="p-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Topic Quality Score
                  </p>
                </div>
                <Badge
                  variant={getStatusBadgeVariant(topicQualityStatus)}
                  className={cn('text-xs', getStatusBadgeColor(topicQualityStatus))}
                >
                  {getStatusBadgeLabel(topicQualityStatus)}
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
                  {metrics.trends.topicQualityScore.direction === 'up' ? '↑' : '↓'}{' '}
                  {Math.abs(metrics.trends.topicQualityScore.change).toFixed(1)}% vs last week
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
          title="Classification Accuracy"
          value={`${metrics.classificationAccuracy}%`}
          subtitle="model performance"
          trend={{
            value: Math.abs(metrics.trends.classificationAccuracy.change),
            direction: mapTrendDirection(metrics.trends.classificationAccuracy.direction),
          }}
          icon={CheckCircleIcon}
          iconColor="text-green-600"
          status={accuracyStatus}
        />

        <MetricCard
          title="Active Analysis Runs"
          value={metrics.activeAnalysisRuns}
          subtitle="currently processing"
          trend={{
            value: Math.abs(metrics.trends.activeAnalysisRuns.change),
            direction: mapTrendDirection(metrics.trends.activeAnalysisRuns.direction),
          }}
          icon={CpuChipIcon}
          iconColor="text-blue-600"
        />
      </div>
    </div>
  )
}
