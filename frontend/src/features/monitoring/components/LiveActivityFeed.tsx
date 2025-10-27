import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import type { TaskExecutionLog, TaskStatus } from '../types'

interface LiveActivityFeedProps {
  events: TaskExecutionLog[]
}

export const LiveActivityFeed = ({ events }: LiveActivityFeedProps) => {
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0
    }
  }, [events])

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Активність в реальному часі</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Очікування подій задач...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Активність в реальному часі
          <Badge variant="secondary" className="ml-auto">
            {events.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={feedRef}
          className="space-y-2 max-h-[500px] overflow-y-auto scroll-smooth"
        >
          {events.map((event, index) => (
            <div
              key={`${event.id}-${index}`}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getStatusVariant(event.status)}>
                    {getStatusText(event.status)}
                  </Badge>
                  <span className="font-medium truncate" title={event.task_name}>
                    {formatTaskName(event.task_name)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <time>{formatTimestamp(event.created_at)}</time>
                  {event.duration_ms !== null && event.duration_ms !== undefined && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(event.duration_ms)}</span>
                    </>
                  )}
                  {event.error_message && (
                    <>
                      <span>•</span>
                      <span className="text-red-600 dark:text-red-400 truncate" title={event.error_message}>
                        {event.error_message}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusVariant(status: TaskStatus): 'default' | 'secondary' | 'success' | 'destructive' {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'destructive'
    case 'running':
      return 'default'
    case 'pending':
      return 'secondary'
    default:
      return 'secondary'
  }
}

function getStatusText(status: TaskStatus): string {
  switch (status) {
    case 'pending':
      return 'В черзі'
    case 'running':
      return 'Виконується'
    case 'success':
      return 'Успішно'
    case 'failed':
      return 'Помилка'
    default:
      return status
  }
}

function formatTaskName(taskName: string): string {
  return taskName
    .replace(/_task$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}
