import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Spinner } from '@shared/ui'
import { apiClient } from '@shared/lib/api/client'
import { TaskStats } from '@shared/types'

const AnalyticsPage = () => {
  const { data: stats, isLoading } = useQuery<TaskStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/stats')
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  const completionRate = stats && stats.total > 0
    ? ((stats.completed / stats.total) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 3xl:space-y-8 animate-fade-in">
      <p className="text-sm sm:text-base text-muted-foreground animate-fade-in-down">Explore signal health, completion ratios, and channel performance trends collected by Topics Radar.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 3xl:gap-8 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
        <Card className="animate-slide-in-left" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
          <h2 className="text-xl 3xl:text-2xl font-semibold mb-4 text-foreground">Task Statistics</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-muted-foreground">Completion Rate</span>
                <span className="text-sm font-medium text-foreground">{completionRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2" role="progressbar" aria-valuenow={parseFloat(completionRate)} aria-valuemin={0} aria-valuemax={100} aria-label="Task completion rate">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-2xl font-bold text-primary">{stats?.total || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Tasks</div>
              </div>
              <div className="text-center p-4 bg-br-peach/10 rounded-lg border border-br-peach/20">
                <div className="text-2xl font-bold text-br-peach">{stats?.pending || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Pending</div>
              </div>
              <div className="text-center p-4 bg-slate-500/10 rounded-lg border border-slate-500/20">
                <div className="text-2xl font-bold text-slate-700">{stats?.in_progress || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">In Progress</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-500">{stats?.completed || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Completed</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="animate-slide-in-right" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
          <h2 className="text-xl 3xl:text-2xl font-semibold mb-4 text-foreground">Status Distribution</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="text-sm font-medium text-foreground">{stats?.pending || 0}</span>
              </div>
              <div
                className="w-full bg-muted rounded-full h-2"
                role="progressbar"
                aria-valuenow={stats && stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Pending tasks: ${stats?.pending || 0} out of ${stats?.total || 0}`}
              >
                <div
                  className="bg-br-peach h-2 rounded-full transition-all duration-300"
                  style={{
                    width: stats && stats.total > 0
                      ? `${(stats.pending / stats.total) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">In Progress</span>
                <span className="text-sm font-medium text-foreground">{stats?.in_progress || 0}</span>
              </div>
              <div
                className="w-full bg-muted rounded-full h-2"
                role="progressbar"
                aria-valuenow={stats && stats.total > 0 ? Math.round((stats.in_progress / stats.total) * 100) : 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`In progress tasks: ${stats?.in_progress || 0} out of ${stats?.total || 0}`}
              >
                <div
                  className="bg-slate-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: stats && stats.total > 0
                      ? `${(stats.in_progress / stats.total) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="text-sm font-medium text-foreground">{stats?.completed || 0}</span>
              </div>
              <div
                className="w-full bg-muted rounded-full h-2"
                role="progressbar"
                aria-valuenow={stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Completed tasks: ${stats?.completed || 0} out of ${stats?.total || 0}`}
              >
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: stats && stats.total > 0
                      ? `${(stats.completed / stats.total) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">Cancelled</span>
                <span className="text-sm font-medium text-foreground">{stats?.cancelled || 0}</span>
              </div>
              <div
                className="w-full bg-muted rounded-full h-2"
                role="progressbar"
                aria-valuenow={stats && stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Cancelled tasks: ${stats?.cancelled || 0} out of ${stats?.total || 0}`}
              >
                <div
                  className="bg-br-orange h-2 rounded-full transition-all duration-300"
                  style={{
                    width: stats && stats.total > 0
                      ? `${(stats.cancelled / stats.total) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AnalyticsPage