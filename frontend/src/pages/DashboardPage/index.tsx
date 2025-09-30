import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Spinner } from '@shared/ui'
import { apiClient } from '@shared/lib/api/client'
import { Task, Message, TaskStats } from '@shared/types'

const DashboardPage = () => {
  const { data: stats, isLoading: statsLoading } = useQuery<TaskStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/stats')
      return response.data
    },
  })

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['messages'],
    queryFn: async () => {
      const response = await apiClient.get('/api/messages')
      return response.data
    },
  })

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await apiClient.get('/api/tasks')
      return response.data
    },
  })

  if (statsLoading || messagesLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="text-sm text-gray-600">Total Tasks</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</div>
        </Card>

        <Card padding="md">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">{stats?.pending || 0}</div>
        </Card>

        <Card padding="md">
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{stats?.in_progress || 0}</div>
        </Card>

        <Card padding="md">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{stats?.completed || 0}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold mb-4">Recent Messages</h2>
          <div className="space-y-3">
            {messages?.slice(0, 5).map((message) => (
              <div key={message.id} className="border-b pb-3 last:border-b-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{message.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {message.sender} • {new Date(message.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {message.is_task && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      Task
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">Recent Tasks</h2>
          <div className="space-y-3">
            {tasks?.slice(0, 5).map((task) => (
              <div key={task.id} className="border-b pb-3 last:border-b-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(task.created_at || task.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`ml-2 px-2 py-1 text-xs rounded ${
                      task.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : task.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage