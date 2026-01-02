/**
 * DashboardMetrics Component
 *
 * Displays 4 MetricCards in a 2x2 grid:
 * - Critical issues (problems)
 * - New Ideas
 * - Decisions Made
 * - Open Questions
 */

import { useTranslation } from 'react-i18next'
import { AlertTriangle, Lightbulb, CheckCircle, HelpCircle } from 'lucide-react'
import { MetricCard } from '@/shared/components/MetricCard'
import { Skeleton } from '@/shared/ui/skeleton'
import { Card, CardContent } from '@/shared/ui/card'
import type { DashboardMetricsProps } from '../types'

const DashboardMetrics = ({ data, isLoading, error }: DashboardMetricsProps) => {
  const { t } = useTranslation('dashboard')

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-semantic-error/30">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('metricsCard.error')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return null
  }

  const getDeltaDirection = (delta: number): 'up' | 'down' | 'neutral' => {
    if (delta > 0) return 'up'
    if (delta < 0) return 'down'
    return 'neutral'
  }

  const metrics = [
    {
      key: 'critical',
      title: t('metricsCard.critical.title'),
      value: data.critical.count,
      delta: data.critical.delta,
      icon: AlertTriangle,
      iconColor: 'text-semantic-error',
      emptyMessage: t('metricsCard.critical.empty'),
      status: data.critical.count > 0 ? ('critical' as const) : undefined,
      deltaLabel: t('metricsCard.critical.deltaLabel'),
    },
    {
      key: 'ideas',
      title: t('metricsCard.ideas.title'),
      value: data.ideas.count,
      delta: data.ideas.delta,
      icon: Lightbulb,
      iconColor: 'text-semantic-warning',
      emptyMessage: t('metricsCard.ideas.empty'),
      deltaLabel: t('metricsCard.ideas.deltaLabel'),
    },
    {
      key: 'decisions',
      title: t('metricsCard.decisions.title'),
      value: data.decisions.count,
      delta: data.decisions.delta,
      icon: CheckCircle,
      iconColor: 'text-semantic-success',
      emptyMessage: t('metricsCard.decisions.empty'),
      status: data.decisions.count > 5 ? ('optimal' as const) : undefined,
      deltaLabel: t('metricsCard.decisions.deltaLabel'),
    },
    {
      key: 'questions',
      title: t('metricsCard.questions.title'),
      value: data.questions.count,
      delta: data.questions.delta,
      icon: HelpCircle,
      iconColor: 'text-semantic-info',
      emptyMessage: t('metricsCard.questions.empty'),
      status: data.questions.count > 3 ? ('warning' as const) : undefined,
      deltaLabel: t('metricsCard.questions.deltaLabel'),
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.key}
          title={metric.title}
          value={metric.value}
          icon={metric.icon}
          iconColor={metric.iconColor}
          trend={
            metric.delta !== 0
              ? {
                  value: Math.abs(metric.delta),
                  direction: getDeltaDirection(metric.delta),
                }
              : undefined
          }
          subtitle={metric.delta !== 0 ? metric.deltaLabel : undefined}
          emptyMessage={metric.emptyMessage}
          status={metric.status}
        />
      ))}
    </div>
  )
}

export default DashboardMetrics
