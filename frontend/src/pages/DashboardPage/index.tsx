import { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ListBulletIcon, ClockIcon, ArrowPathIcon, CheckCircleIcon, WifiIcon, CpuChipIcon, DocumentCheckIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { SignalSlashIcon } from '@heroicons/react/24/outline'
import { OnboardingWizard } from '@/features/onboarding'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Badge, Skeleton, Button } from '@/shared/ui'
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar'
import { TelegramIcon } from '@/shared/components/TelegramIcon'
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import { TaskStats, SidebarCounts } from '@/shared/types'
import MetricCard from '@/shared/components/MetricCard'
import ActivityHeatmap from '@/shared/components/ActivityHeatmap'
import { useTasksStore } from '@/features/tasks/store/tasksStore'
import { useMessagesFeed } from '@/features/messages/hooks/useMessagesFeed'
import { MessagesErrorBoundary } from '@/features/messages/components'
import { formatMessageDate } from '@/shared/utils/date'
import { RecentTopics } from './RecentTopics'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { setFilterStatus } = useTasksStore()
  const [showOnboarding, setShowOnboarding] = useState(false)

  const { data: stats, isLoading: statsLoading } = useQuery<TaskStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.stats)
      return response.data
    },
  })

  const { data: sidebarCounts } = useQuery<SidebarCounts>({
    queryKey: ['sidebar-counts'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.sidebarCounts)
      return response.data
    },
  })

  const handleMetricClick = (filter: 'all' | 'pending' | 'in_progress' | 'completed' | 'open') => {
    setFilterStatus(filter)
    navigate('/tasks')
  }

  const { messages, isLoading: messagesLoading, isConnected } = useMessagesFeed({ limit: 50 })

  const recentMessages = useMemo(() => {
    return messages.slice(0, 5)
  }, [messages])

  const metrics = useMemo(() => {
    if (!stats) return null

    const { by_status, total_trend, open_trend, in_progress_trend, completion_rate_trend } = stats
    const completionRate = stats.total_tasks > 0
      ? Math.round((by_status.completed / stats.total_tasks) * 100)
      : 0

    return {
      total: {
        value: stats.total_tasks,
        trend: {
          value: Math.abs(total_trend.change_percent),
          direction: total_trend.direction,
        },
        subtitle: 'vs last week',
      },
      open: {
        value: by_status.open,
        trend: {
          value: Math.abs(open_trend.change_percent),
          direction: open_trend.direction,
        },
        subtitle: 'awaiting action',
      },
      inProgress: {
        value: by_status.in_progress,
        trend: {
          value: Math.abs(in_progress_trend.change_percent),
          direction: in_progress_trend.direction,
        },
        subtitle: 'actively working',
      },
      successRate: {
        value: `${completionRate}%`,
        trend: {
          value: Math.abs(completion_rate_trend.change_percent),
          direction: completion_rate_trend.direction,
        },
        subtitle: 'completion rate',
      },
    }
  }, [stats])

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed')
    const hasSkippedOnboarding = localStorage.getItem('onboarding_skipped')

    if (!hasCompletedOnboarding && !hasSkippedOnboarding && !statsLoading && stats) {
      const hasNoData = stats.total_tasks === 0 && messages.length === 0
      if (hasNoData) {
        setShowOnboarding(true)
      }
    }
  }, [statsLoading, stats, messages.length])

  const hasNoData = stats && stats.total_tasks === 0 && messages.length === 0

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 animate-fade-in">
      <OnboardingWizard open={showOnboarding} onClose={() => setShowOnboarding(false)} />

      {hasNoData && !statsLoading && (
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <ListBulletIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Connect your Telegram to start tracking messages and analyzing tasks
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <Button onClick={() => navigate('/settings')} size="lg">
                <Cog6ToothIcon className="mr-2 h-5 w-5" />
                Configure Settings
              </Button>
              <Button onClick={() => navigate('/messages')} variant="outline" size="lg">
                View Messages
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric Cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 3xl:gap-6 animate-fade-in-up"
        role="region"
        aria-label="Task statistics"
        aria-live="polite"
        aria-atomic="false"
      >
        {statsLoading || !metrics ? (
          <>
            {[...Array(6)].map((_, i) => (
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
              icon={ListBulletIcon}
              iconColor="text-primary"
              onClick={() => handleMetricClick('all')}
              emptyMessage="Import messages to start tracking"
            />
            <MetricCard
              title="Open Tasks"
              value={metrics.open.value}
              subtitle={metrics.open.subtitle}
              trend={metrics.open.trend}
              icon={ClockIcon}
              iconColor="text-primary-400"
              onClick={() => handleMetricClick('open')}
            />
            <MetricCard
              title="In Progress"
              value={metrics.inProgress.value}
              subtitle={metrics.inProgress.subtitle}
              trend={metrics.inProgress.trend}
              icon={ArrowPathIcon}
              iconColor="text-secondary-foreground"
              onClick={() => handleMetricClick('in_progress')}
            />
            <MetricCard
              title="Success Rate"
              value={metrics.successRate.value}
              subtitle={metrics.successRate.subtitle}
              trend={metrics.successRate.trend}
              icon={CheckCircleIcon}
              iconColor="text-green-600"
              onClick={() => handleMetricClick('completed')}
            />
            <MetricCard
              title="Pending Analysis"
              value={sidebarCounts?.unclosed_runs || 0}
              subtitle="AI runs active"
              icon={CpuChipIcon}
              iconColor="text-blue-600"
              onClick={() => navigate('/analysis')}
            />
            <MetricCard
              title="Proposals to Review"
              value={sidebarCounts?.pending_proposals || 0}
              subtitle="awaiting review"
              icon={DocumentCheckIcon}
              iconColor="text-amber-600"
              onClick={() => navigate('/proposals')}
            />
          </>
        )}
      </div>

      {/* Recent Topics and Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 3xl:gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
        {/* Recent Topics - 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <RecentTopics />
        </div>

        {/* Recent Messages - 1/3 width on large screens */}
        <MessagesErrorBoundary>
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Messages</span>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <WifiIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <SignalSlashIcon className="h-4 w-4 text-amber-500" />
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
              ) : recentMessages.length > 0 ? (
                recentMessages.map((message) => (
                  <div
                    key={message.id}
                    className="group flex items-start gap-3 py-2 border-b last:border-b-0 rounded-md cursor-pointer transition-all duration-200 hover:bg-accent/50 -mx-2 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    tabIndex={0}
                    role="button"
                    aria-label={`Message from ${message.author_name || 'Unknown'}: ${message.content || ''}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                      }
                    }}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 border border-border/80 shadow-sm ring-1 ring-black/5">
                        {message.avatar_url ? (
                          <AvatarImage src={message.avatar_url} alt={message.author_name || 'User'} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {message.author_name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
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
        </MessagesErrorBoundary>
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
