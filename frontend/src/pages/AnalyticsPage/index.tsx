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
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Task Statistics</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-muted-foreground">Completion Rate</span>
                <span className="text-sm font-medium text-foreground">{completionRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
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
              <div className="text-center p-4 bg-br-blue/10 rounded-lg border border-br-blue/20">
                <div className="text-2xl font-bold text-br-blue">{stats?.in_progress || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">In Progress</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-500">{stats?.completed || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">Completed</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Status Distribution</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="text-sm font-medium text-foreground">{stats?.pending || 0}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
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
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-br-blue h-2 rounded-full transition-all duration-300"
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
              <div className="w-full bg-muted rounded-full h-2">
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
              <div className="w-full bg-muted rounded-full h-2">
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