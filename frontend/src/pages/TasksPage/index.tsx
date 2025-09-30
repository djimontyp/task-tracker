import React, { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Button, Spinner } from '@shared/ui'
import { apiClient } from '@shared/lib/api/client'
import { Task, TaskStatus } from '@shared/types'
import { useTasksStore } from '@features/tasks/store/tasksStore'
import toast from 'react-hot-toast'

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tasks</h1>

        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'in_progress', 'completed', 'cancelled'] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-8">No tasks found</p>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} hover>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>Created: {new Date(task.created_at || task.createdAt).toLocaleDateString()}</span>
                    {(task.due_date || task.dueDate) && <span>• Due: {new Date(task.due_date || task.dueDate || '').toLocaleDateString()}</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium ${
                        task.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : task.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default TasksPage