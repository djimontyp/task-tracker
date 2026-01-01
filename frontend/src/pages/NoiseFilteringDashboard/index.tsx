import { useMemo, useState } from 'react'
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
          toast.success(`Scored ${message.data.scored} messages`)
          queryClient.invalidateQueries({ queryKey: ['noise-stats'] })
        }
      }
    },
    reconnect: true,
  })

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
    <PageWrapper variant="fullWidth">
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => scoreBatchMutation.mutate(batchScoringLimit)}
          disabled={scoreBatchMutation.isPending}
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${scoreBatchMutation.isPending ? 'animate-spin' : ''}`} />
          Score Unscored Messages
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
              title="Total messages"
              value={metrics.totalMessages.value}
              subtitle={metrics.totalMessages.subtitle}
              icon={MessageSquare}
              iconColor="text-primary"
            />
            <MetricCard
              title="Signal ratio"
              value={metrics.signalRatio.value}
              subtitle={metrics.signalRatio.subtitle}
              trend={metrics.signalRatio.trend}
              icon={CheckCircle}
              iconColor="text-semantic-success"
            />
            <MetricCard
              title="Needs review"
              value={metrics.needsReview.value}
              subtitle={metrics.needsReview.subtitle}
              trend={metrics.needsReview.trend}
              icon={AlertTriangle}
              iconColor="text-semantic-warning"
            />
            <MetricCard
              title="Top noise source"
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
            <div className="space-y-4" role="list" aria-label="Top noise sources">
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
    </PageWrapper>
  )
}

export default NoiseFilteringDashboard
