import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ListTodo, Clock, Loader2, CheckCircle2, Wifi, WifiOff } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Badge, Skeleton } from '@/shared/ui'
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar'
import { AvatarGroup } from '@/shared/components/AvatarGroup'
import { TelegramIcon } from '@/shared/components/TelegramIcon'
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import { Task, TaskStats } from '@/shared/types'
import MetricCard from '@/shared/components/MetricCard'
import ActivityHeatmap from '@/shared/components/ActivityHeatmap'
import { useTasksStore } from '@/features/tasks/store/tasksStore'
import { useMessagesFeed } from '@/features/messages/hooks/useMessagesFeed'
import { formatMessageDate } from '@/shared/utils/date'
import { generateTaskAvatars } from '@/shared/utils/avatars'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { setFilterStatus } = useTasksStore()

  const { data: stats, isLoading: statsLoading } = useQuery<TaskStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.stats)
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
      const response = await apiClient.get(API_ENDPOINTS.tasks)
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
                    <div key={i} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </>
              ) : messages && messages.length > 0 ? (
                messages.slice(0, 5).map((message) => (
                  <div
                    key={message.id}
                    className="group flex items-start gap-3 py-2 border-b last:border-b-0 rounded-md cursor-pointer transition-all duration-200 hover:bg-accent/50 -mx-2 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    tabIndex={0}
                    role="button"
                    aria-label={`Message from ${message.author_name || 'Unknown'}: ${message.content || ''}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        // Handle message click if needed
                      }
                    }}
                  >
                    {/* Avatar with Telegram Badge */}
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 border border-border/80 shadow-sm ring-1 ring-black/5">
                        {message.avatar_url ? (
                          <AvatarImage src={message.avatar_url} alt={message.author_name || 'User'} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {message.author_name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {/* Telegram Badge - positioned bottom-right */}
                      <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-[#0088cc] flex items-center justify-center shadow-md ring-2 ring-background">
                        <TelegramIcon size={14} className="text-white drop-shadow-sm" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {message.author_name || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                          {formatMessageDate(message.sent_at || message.timestamp)}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground leading-snug break-words line-clamp-2">
                        {message.content || ''}
                      </p>

                      {(message.is_task || message.isTask) && (
                        <div className="pt-0.5">
                          <Badge variant="outline" className="text-[10px] h-5 uppercase tracking-wide">
                            Task
                          </Badge>
                        </div>
                      )}
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
                    <div key={i} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-col">
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))}
                </>
              ) : tasks && tasks.length > 0 ? (
                tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-start gap-3 py-2 border-b last:border-b-0 rounded-md cursor-pointer transition-all duration-200 hover:bg-accent/50 -mx-2 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {task.title}
                        </span>
                      </div>
                    </div>
                    
                    {/* Right-aligned Avatar Group */}
                    <div className="relative shrink-0">
                      <AvatarGroup avatars={generateTaskAvatars(task.id)} size="lg" max={3} />
                    </div>

                    <div className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {formatMessageDate(task.created_at || task.createdAt)}
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
          enabledSources={['telegram'] as ('telegram' | 'slack' | 'email')[]}
          className="w-full"
        />
      </div>
    </div>
  )
}
export default DashboardPage
