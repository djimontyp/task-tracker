export interface MetricTrend {
  direction: 'up' | 'down' | 'stable'
  change: number
}

export interface MetricThreshold {
  value: number
  status: 'ok' | 'warning' | 'critical'
}

export interface DashboardMetrics {
  topicQualityScore: number
  noiseRatio: number
  classificationAccuracy: number
  activeAnalysisRuns: number
  trends: {
    topicQualityScore: MetricTrend
    noiseRatio: MetricTrend
    classificationAccuracy: MetricTrend
    activeAnalysisRuns: MetricTrend
  }
}

export interface MetricCardData {
  name: string
  value: number | string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: number
  threshold?: MetricThreshold
  icon?: React.ComponentType<{ className?: string }>
}

export interface QualityScoreProps {
  score: number
  topicName?: string
  showTooltip?: boolean
}

export interface NoiseStatsProps {
  totalMessages: number
  noisyMessages: number
  noiseRatio: number
  trendData?: number[]
}
