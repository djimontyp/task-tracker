import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Badge, Skeleton, Button } from '@/shared/ui'
import { MetricCard } from '@/shared/components/MetricCard'
import { noiseService } from '@/features/noise/api/noiseService'
import type { NoiseStats } from '@/features/noise/types'
import { toast } from 'sonner'
import { useWebSocket } from '@/shared/hooks'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { PageWrapper } from '@/shared/primitives'

const NoiseFilteringDashboard = () => {
  const { t, i18n } = useTranslation('noiseFiltering')
  const { t: tCommon } = useTranslation()
  const queryClient = useQueryClient()
  const [batchScoringLimit] = useState(100)

  const { data: stats, isLoading: statsLoading } = useQuery<NoiseStats>({
    queryKey: ['noise-stats'],
    queryFn: () => noiseService.getNoiseStats(),
    refetchInterval: 30000,
  })

  useWebSocket({
    topics: ['noise_filtering'],
    onMessage: (data) => {
      const message = data as { topic: string; event: string; data?: { scored: number } }
      if (message.topic === 'noise_filtering') {
        if (message.event === 'message_scored') {
          queryClient.invalidateQueries({ queryKey: ['noise-stats'] })
        }
        if (message.event === 'batch_scored' && message.data) {
          toast.success(tCommon('toast.success.scored', { count: message.data.scored }))
          queryClient.invalidateQueries({ queryKey: ['noise-stats'] })
        }
      }
    },
    _reconnect: true,
  })

  const scoreBatchMutation = useMutation({
    mutationFn: (limit: number) => noiseService.triggerBatchScoring(limit),
    onSuccess: (data) => {
      toast.success(tCommon('toast.success.scored', { count: data.messages_queued }))
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['noise-stats'] })
      }, 5000)
    },
    onError: (error: Error) => {
      toast.error(tCommon('toast.error.scoringFailed', { error: error.message }))
    },
  })

  const metrics = useMemo(() => {
    if (!stats) return null

    const signalRatio = Math.round(stats.signal_ratio * 100)
    const signalTrend = signalRatio > 70 ? 'up' : signalRatio < 50 ? 'down' : 'neutral'
    const reviewTrend = stats.needs_review < 10 ? 'down' : 'up'

    const topNoiseSource = stats.top_noise_sources.length > 0
      ? stats.top_noise_sources[0].name
      : 'N/A'

    return {
      totalMessages: {
        value: stats.total_messages,
        subtitle: `${stats.signal_count} ${t('chart.signal').toLowerCase()} / ${stats.noise_count} ${t('chart.noise').toLowerCase()}`,
      },
      signalRatio: {
        value: `${signalRatio}%`,
        trend: { value: 5, direction: signalTrend as 'up' | 'down' | 'neutral' },
        subtitle: t('metrics.ofAllMessages'),
      },
      needsReview: {
        value: stats.needs_review,
        trend: { value: 3, direction: reviewTrend as 'up' | 'down' | 'neutral' },
        subtitle: t('metrics.requiringManualReview'),
      },
      topNoiseSource: {
        value: topNoiseSource,
        subtitle: t('metrics.mostFrequentNoiseSource'),
      },
    }
  }, [stats, t])

  const chartData = useMemo(() => {
    if (!stats) return []
    return stats.trend.map(d => ({
      date: new Date(d.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }),
      [t('chart.signal')]: d.signal,
      [t('chart.noise')]: d.noise,
      [t('chart.weakSignal')]: d.weak_signal,
    }))
  }, [stats, t, i18n.language])

  return (
    <PageWrapper variant="fullWidth">
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => scoreBatchMutation.mutate(batchScoringLimit)}
          disabled={scoreBatchMutation.isPending}
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${scoreBatchMutation.isPending ? 'animate-spin' : ''}`} />
          {t('actions.scoreUnscored')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 md:gap-6 animate-fade-in-up">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-12 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : metrics ? (
          <>
            <MetricCard
              title={t('metrics.totalMessages')}
              value={metrics.totalMessages.value}
              subtitle={metrics.totalMessages.subtitle}
              icon={MessageSquare}
              iconColor="text-primary"
            />
            <MetricCard
              title={t('metrics.signalRatio')}
              value={metrics.signalRatio.value}
              subtitle={metrics.signalRatio.subtitle}
              trend={metrics.signalRatio.trend}
              icon={CheckCircle}
              iconColor="text-semantic-success"
            />
            <MetricCard
              title={t('metrics.needsReview')}
              value={metrics.needsReview.value}
              subtitle={metrics.needsReview.subtitle}
              trend={metrics.needsReview.trend}
              icon={AlertTriangle}
              iconColor="text-semantic-warning"
            />
            <MetricCard
              title={t('metrics.topNoiseSource')}
              value={metrics.topNoiseSource.value}
              subtitle={metrics.topNoiseSource.subtitle}
              icon={RefreshCw}
              iconColor="text-semantic-error"
            />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('chart.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={t('chart.signal')}
                    stroke="hsl(var(--chart-signal))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-signal))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey={t('chart.noise')}
                    stroke="hsl(var(--semantic-error))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--semantic-error))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey={t('chart.weakSignal')}
                    stroke="hsl(var(--semantic-warning))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--semantic-warning))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('noiseSources.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" role="list" aria-label={t('noiseSources.ariaLabel')}>
              {statsLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ))}
                </>
              ) : stats && stats.top_noise_sources.length > 0 ? (
                stats.top_noise_sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                    role="listitem"
                  >
                    <span className="text-sm font-medium text-foreground">{source.name}</span>
                    <Badge variant="destructive">{source.count} {t('noiseSources.noise')}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('noiseSources.noSources')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}

export default NoiseFilteringDashboard
