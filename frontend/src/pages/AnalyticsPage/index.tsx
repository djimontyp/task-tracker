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
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold mb-4">Task Statistics</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                <span className="text-sm font-medium text-gray-900">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{stats?.total || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Total Tasks</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Pending</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats?.in_progress || 0}</div>
                <div className="text-sm text-gray-600 mt-1">In Progress</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Completed</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">Status Distribution</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="text-sm font-medium text-gray-900">{stats?.pending || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
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
                <span className="text-sm text-gray-600">In Progress</span>
                <span className="text-sm font-medium text-gray-900">{stats?.in_progress || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
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
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-sm font-medium text-gray-900">{stats?.completed || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
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
                <span className="text-sm text-gray-600">Cancelled</span>
                <span className="text-sm font-medium text-gray-900">{stats?.cancelled || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
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