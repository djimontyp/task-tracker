import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { ListTodo, Clock, Loader2, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton } from '@shared/ui'
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">Total Tasks</div>
                  <ListTodo className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground">{stats?.total || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <Clock className="w-5 h-5 text-br-peach" />
                </div>
                <div className="text-3xl font-bold text-br-peach">{stats?.pending || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">In Progress</div>
                  <Loader2 className="w-5 h-5 text-br-blue" />
                </div>
                <div className="text-3xl font-bold text-br-blue">{stats?.in_progress || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">Completed</div>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600">{stats?.completed || 0}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {messagesLoading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border-b pb-3 last:border-b-0">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))}
                </>
              ) : (
                messages?.slice(0, 5).map((message) => (
                  <div key={message.id} className="border-b pb-3 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.sender} • {new Date(message.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {message.is_task && (
                        <Badge variant="default" className="ml-2">
                          Task
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasksLoading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border-b pb-3 last:border-b-0">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))}
                </>
              ) : (
                tasks?.slice(0, 5).map((task) => (
                  <div key={task.id} className="border-b pb-3 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(task.created_at || task.createdAt).toLocaleString()}
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
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage