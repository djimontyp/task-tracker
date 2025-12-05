import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import type { TaskMetrics } from '../types'

interface HealthCardsProps {
  metrics: TaskMetrics[]
}

export const HealthCards = ({ metrics }: HealthCardsProps) => {
  if (metrics.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Немає даних про виконання задач
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.task_name} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium text-muted-foreground truncate" title={metric.task_name}>
              {formatTaskName(metric.task_name)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {metric.running > 0 && (
                <Badge variant="default" className="bg-status-validating hover:bg-status-validating/80">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Виконується: {metric.running}
                  </span>
                </Badge>
              )}
              {metric.pending > 0 && (
                <Badge variant="secondary">
                  В черзі: {metric.pending}
                </Badge>
              )}
              {metric.success > 0 && (
                <Badge variant="success">
                  ✓ {metric.success}
                </Badge>
              )}
              {metric.failed > 0 && (
                <Badge variant="destructive">
                  ✗ {metric.failed}
                </Badge>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Всього:</span>
                <span className="font-medium">{metric.total_executions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Середня тривалість:</span>
                <span className="font-medium">{formatDuration(metric.avg_duration_ms)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Успішність:</span>
                <span className={`font-medium ${getSuccessRateColor(metric.success_rate)}`}>
                  {metric.success_rate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function formatTaskName(taskName: string): string {
  return taskName
    .replace(/_task$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function getSuccessRateColor(rate: number): string {
  if (rate >= 95) return 'text-semantic-success'
  if (rate >= 80) return 'text-semantic-warning'
  return 'text-semantic-error'
}
