import { useMemo, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Badge, Skeleton, Button } from '@/shared/ui'
import { PageHeader } from '@/shared/components/PageHeader'
import MetricCard from '@/shared/components/MetricCard'
import { noiseService } from '@/features/noise/api/noiseService'
import type { NoiseStats } from '@/features/noise/types'
import { toast } from 'sonner'
import { logger } from '@/shared/utils/logger'
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

const NoiseFilteringDashboard = () => {
  const queryClient = useQueryClient()
  const [batchScoringLimit] = useState(100)

  const { data: stats, isLoading: statsLoading } = useQuery<NoiseStats>({
    queryKey: ['noise-stats'],
    queryFn: () => noiseService.getNoiseStats(),
    refetchInterval: 30000,
  })

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost/ws'
    const ws = new WebSocket(`${wsUrl}?topics=noise_filtering`)

    ws.onopen = () => {
      logger.debug('[NoiseFilteringDashboard] WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        const { topic, event: eventType, data } = message

        if (topic === 'noise_filtering') {
          if (eventType === 'message_scored') {
            queryClient.invalidateQueries({ queryKey: ['noise-stats'] })
          }

          if (eventType === 'batch_scored') {
            toast.success(`Scored ${data.scored} messages`)
            queryClient.invalidateQueries({ queryKey: ['noise-stats'] })
          }
        }
      } catch (error) {
        console.error('[NoiseFilteringDashboard] Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('[NoiseFilteringDashboard] WebSocket error:', error)
      toast.error('WebSocket connection failed')
    }

    ws.onclose = () => {
      logger.debug('[NoiseFilteringDashboard] WebSocket disconnected')
    }

    return () => {
      ws.close()
    }
  }, [queryClient])

  const scoreBatchMutation = useMutation({
    mutationFn: (limit: number) => noiseService.triggerBatchScoring(limit),
    onSuccess: (data) => {
      toast.success(`Scoring ${data.messages_queued} messages (${data.total_unscored} unscored total)`)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['noise-stats'] })
      }, 5000)
    },
    onError: (error: Error) => {
      toast.error(`Failed to trigger scoring: ${error.message}`)
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
        subtitle: `${stats.signal_count} signal / ${stats.noise_count} noise`,
      },
      signalRatio: {
        value: `${signalRatio}%`,
        trend: { value: 5, direction: signalTrend as 'up' | 'down' | 'neutral' },
        subtitle: 'of all messages',
      },
      needsReview: {
        value: stats.needs_review,
        trend: { value: 3, direction: reviewTrend as 'up' | 'down' | 'neutral' },
        subtitle: 'requiring manual review',
      },
      topNoiseSource: {
        value: topNoiseSource,
        subtitle: 'most frequent noise source',
      },
    }
  }, [stats])

  const chartData = useMemo(() => {
    if (!stats) return []
    return stats.trend.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Signal: d.signal,
      Noise: d.noise,
      'Weak Signal': d.weak_signal,
    }))
  }, [stats])

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 animate-fade-in">
      <PageHeader
        title="Noise Filtering"
        description="Message scoring statistics, signal-to-noise ratio, quality metrics, and filtering effectiveness over time"
        actions={
          <Button
            onClick={() => scoreBatchMutation.mutate(batchScoringLimit)}
            disabled={scoreBatchMutation.isPending}
            size="sm"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${scoreBatchMutation.isPending ? 'animate-spin' : ''}`} />
            Score Unscored Messages
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 animate-fade-in-up">
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
              title="Total Messages"
              value={metrics.totalMessages.value}
              subtitle={metrics.totalMessages.subtitle}
              icon={ChatBubbleLeftRightIcon}
              iconColor="text-primary"
            />
            <MetricCard
              title="Signal Ratio"
              value={metrics.signalRatio.value}
              subtitle={metrics.signalRatio.subtitle}
              trend={metrics.signalRatio.trend}
              icon={CheckCircleIcon}
              iconColor="text-green-600"
            />
            <MetricCard
              title="Needs Review"
              value={metrics.needsReview.value}
              subtitle={metrics.needsReview.subtitle}
              trend={metrics.needsReview.trend}
              icon={ExclamationTriangleIcon}
              iconColor="text-amber-600"
            />
            <MetricCard
              title="Top Noise Source"
              value={metrics.topNoiseSource.value}
              subtitle={metrics.topNoiseSource.subtitle}
              icon={ArrowPathIcon}
              iconColor="text-red-600"
            />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Noise Trends - Last 7 Days</CardTitle>
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
                    dataKey="Signal"
                    stroke="hsl(var(--chart-signal))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-signal))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Noise"
                    stroke="hsl(var(--semantic-error))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--semantic-error))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Weak Signal"
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
            <CardTitle>Top Noise Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" role="list" aria-label="Top noise sources">
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
                    <Badge variant="destructive">{source.count} noise</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No noise sources yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default NoiseFilteringDashboard
