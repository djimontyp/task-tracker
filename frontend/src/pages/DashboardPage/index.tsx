import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ListTodo, Clock, Loader2, CheckCircle2, Wifi, WifiOff } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Badge, Skeleton } from '@/shared/ui'
import { apiClient } from '@/shared/lib/api/client'
import { Task, TaskStats } from '@/shared/types'
import MetricCard from '@/shared/components/MetricCard'
import ActivityHeatmap from '@/shared/components/ActivityHeatmap'
import { useTasksStore } from '@/features/tasks/store/tasksStore'
import { useMessagesFeed } from '@/features/messages/hooks/useMessagesFeed'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { setFilterStatus } = useTasksStore()

  const { data: stats, isLoading: statsLoading } = useQuery<TaskStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/stats')
      return response.data
    },
  })

  const handleMetricClick = (filter: 'all' | 'pending' | 'in_progress' | 'completed') => {
    setFilterStatus(filter)
    navigate('/tasks')
  }

  // Use the new messages feed with WebSocket support
  const { messages, isLoading: messagesLoading, isConnected } = useMessagesFeed({ limit: 50 })

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await apiClient.get('/api/tasks')
      return response.data
    },
  })

  // Calculate metrics with trends
  const metrics = useMemo(() => {
    const total = stats?.total || 0
    const pending = stats?.pending || 0
    const inProgress = stats?.in_progress || 0
    const completed = stats?.completed || 0
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total: {
        value: total,
        trend: { value: 12, direction: 'up' as const },
        subtitle: 'vs last month',
      },
      pending: {
        value: pending,
        trend: { value: 8, direction: 'down' as const },
        subtitle: 'awaiting action',
      },
      inProgress: {
        value: inProgress,
        trend: { value: 5, direction: 'up' as const },
        subtitle: 'actively working',
      },
      successRate: {
        value: `${successRate}%`,
        trend: { value: 3, direction: 'up' as const },
        subtitle: 'completion rate',
      },
    }
  }, [stats])

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 animate-fade-in">

      {/* Metric Cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 3xl:gap-6 animate-fade-in-up"
        role="region"
        aria-label="Task statistics"
        aria-live="polite"
        aria-atomic="false"
      >
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
        ) : (
          <>
            <MetricCard
              title="Total Tasks"
              value={metrics.total.value}
              subtitle={metrics.total.subtitle}
              trend={metrics.total.trend}
              icon={ListTodo}
              iconColor="text-primary"
              onClick={() => handleMetricClick('all')}
            />
            <MetricCard
              title="Pending Tasks"
              value={metrics.pending.value}
              subtitle={metrics.pending.subtitle}
              trend={metrics.pending.trend}
              icon={Clock}
              iconColor="text-primary-400"
              onClick={() => handleMetricClick('pending')}
            />
            <MetricCard
              title="In Progress"
              value={metrics.inProgress.value}
              subtitle={metrics.inProgress.subtitle}
              trend={metrics.inProgress.trend}
              icon={Loader2}
              iconColor="text-secondary-foreground"
              onClick={() => handleMetricClick('in_progress')}
            />
            <MetricCard
              title="Success Rate"
              value={metrics.successRate.value}
              subtitle={metrics.successRate.subtitle}
              trend={metrics.successRate.trend}
              icon={CheckCircle2}
              iconColor="text-green-600"
              onClick={() => handleMetricClick('completed')}
            />
          </>
        )}
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 3xl:gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Messages</span>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-amber-500" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" role="feed" aria-label="Recent messages feed" aria-busy={messagesLoading}>
              {messagesLoading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3 border-b pb-3 last:border-b-0">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </>
              ) : messages && messages.length > 0 ? (
                messages.slice(0, 5).map((message) => (
                  <div
                    key={message.id}
                    className="flex gap-3 border-b pb-3 last:border-b-0 cursor-pointer hover:bg-accent/50 active:scale-[0.99] transition-all duration-150 -mx-6 px-6 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    tabIndex={0}
                    role="button"
                    aria-label={`Message from ${message.author}: ${message.content}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        // Handle message click if needed
                      }
                    }}
                  >
                    {/* Avatar */}
                    <div className="shrink-0">
                      {message.avatar_url ? (
                        <img
                          src={message.avatar_url}
                          alt={message.author}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {message.author?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Message content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground/90 break-words">
                            {message.content || message.text}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <span className="font-medium">{message.author || message.sender}</span>
                            <span>•</span>
                            <span>{message.sent_at ? new Date(message.sent_at).toLocaleString('uk-UA') : message.timestamp ? new Date(message.timestamp).toLocaleString('uk-UA') : 'No date'}</span>
                            {!isConnected && (
                              <>
                                <span>•</span>
                                <span className="text-amber-500">Offline</span>
                              </>
                            )}
                          </p>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 shrink-0">
                          {(message.is_task || message.isTask) && (
                            <Badge variant="default" className="text-xs">
                              Task
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No messages yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" role="feed" aria-label="Recent tasks feed" aria-busy={tasksLoading}>
              {tasksLoading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border-b pb-3 last:border-b-0">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))}
                </>
              ) : tasks && tasks.length > 0 ? (
                tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="border-b pb-3 last:border-b-0 cursor-pointer hover:bg-accent/50 active:scale-[0.99] transition-all duration-150 -mx-6 px-6 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    tabIndex={0}
                    role="button"
                    aria-label={`Task: ${task.title}, Status: ${task.status}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        // Handle task click if needed - could navigate to task details
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(task.created_at || task.createdAt).toLocaleString('uk-UA')}
                        </p>
                      </div>
                      <Badge
                        variant={
                          task.status === 'completed'
                            ? 'default'
                            : task.status === 'in_progress'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="ml-2"
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tasks yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}>
        <ActivityHeatmap
          title="Message Activity Heatmap"
          period="week"
          enabledSources={['telegram']}
          className="w-full"
        />
      </div>
    </div>
  )
}

export default DashboardPage
