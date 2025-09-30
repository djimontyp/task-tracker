import React, { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Spinner,
  Card,
  CardContent,
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@shared/ui'
import { apiClient } from '@shared/lib/api/client'
import { Task, TaskStatus } from '@shared/types'
import { useTasksStore } from '@features/tasks/store/tasksStore'
import { toast } from 'sonner'

const TasksPage = () => {
  const queryClient = useQueryClient()
  const { filterStatus, setFilterStatus, setTasks } = useTasksStore()

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await apiClient.get('/api/tasks')
      return response.data
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const response = await apiClient.put(`/api/tasks/${id}/status`, { status })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Task status updated')
    },
    onError: () => {
      toast.error('Failed to update task')
    },
  })

  useEffect(() => {
    if (tasks) {
      setTasks(tasks)
    }
  }, [tasks, setTasks])

  const filteredTasks = React.useMemo(() => {
    if (!tasks) return []
    if (filterStatus === 'all') return tasks
    return tasks.filter((task) => task.status === filterStatus)
  }, [tasks, filterStatus])

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTaskMutation.mutate({ id: taskId, status })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-down">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tasks</h1>

        <div className="flex gap-2 flex-wrap animate-slide-in-right">
          {(['all', 'pending', 'in_progress', 'completed', 'cancelled'] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No tasks found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task, index) => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow animate-scale-in" style={{ animationDelay: `${0.05 * index}s`, animationFillMode: 'backwards' }}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Created: {new Date(task.created_at || task.createdAt).toLocaleDateString()}</span>
                      {(task.due_date || task.dueDate) && <span>• Due: {new Date(task.due_date || task.dueDate || '').toLocaleDateString()}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Badge
                      className={
                        task.priority === 'urgent' || task.priority === 'high'
                          ? 'bg-br-orange text-white hover:bg-br-orange/90'
                          : task.priority === 'medium'
                          ? 'bg-br-peach text-white hover:bg-br-peach/90'
                          : 'bg-br-blue text-white hover:bg-br-blue/90'
                      }
                    >
                      {task.priority}
                    </Badge>

                    <Select
                      value={task.status}
                      onValueChange={(value) => handleStatusChange(task.id, value as TaskStatus)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default TasksPage