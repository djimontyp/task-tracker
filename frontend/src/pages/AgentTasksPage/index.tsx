import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  Button,
  Badge,
  Spinner,
} from '@/shared/ui'
import { taskService } from '@/features/agents/api'
import { TaskConfig, TaskConfigCreate, TaskConfigUpdate } from '@/features/agents/types'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { TaskForm } from '@/features/agents/components'
import { PageWrapper } from '@/shared/primitives'

const AgentTasksPage = () => {
  const { t } = useTranslation('agentTasks')
  const { t: tCommon } = useTranslation()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskConfig | null>(null)

  const { data: tasks, isLoading } = useQuery<TaskConfig[]>({
    queryKey: ['task-configs'],
    queryFn: () => taskService.listTasks(),
  })

  const createMutation = useMutation({
    mutationFn: (data: TaskConfigCreate) => taskService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-configs'] })
      toast.success(tCommon('toast.success.created', { entity: tCommon('toast.entities.task') }))
      setFormOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || tCommon('toast.error.createFailed', { entity: tCommon('toast.entities.task') }))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskConfigUpdate }) =>
      taskService.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-configs'] })
      toast.success(tCommon('toast.success.updated', { entity: tCommon('toast.entities.task') }))
      setFormOpen(false)
      setEditingTask(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || tCommon('toast.error.updateFailed', { entity: tCommon('toast.entities.task') }))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-configs'] })
      toast.success(tCommon('toast.success.deleted', { entity: tCommon('toast.entities.task') }))
    },
    onError: (error: Error) => {
      toast.error(error.message || tCommon('toast.error.deleteFailed', { entity: tCommon('toast.entities.task') }))
    },
  })

  const handleCreate = () => {
    setEditingTask(null)
    setFormOpen(true)
  }

  const handleEdit = (task: TaskConfig) => {
    setEditingTask(task)
    setFormOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm(t('confirmation.delete'))) {
      deleteMutation.mutate(id)
    }
  }

  const handleSubmit = (data: TaskConfigCreate | TaskConfigUpdate) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data })
    } else {
      createMutation.mutate(data as TaskConfigCreate)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <PageWrapper variant="fullWidth">
      {/* Actions toolbar */}
      <div className="flex justify-end mb-4">
        <Button onClick={handleCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t('actions.addTask')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                {t('empty.description')}
              </p>
            </CardContent>
          </Card>
        ) : (
          tasks?.map((task) => (
            <Card key={task.id} className="card-interactive">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{task.name}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(task)}
                        aria-label={t('actions.editTask')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(task.id)}
                        aria-label={t('actions.deleteTask')}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('card.schemaFields')}</span>
                      <div className="mt-2 space-x-2">
                        {task.response_schema?.properties ? (
                          Object.keys(task.response_schema.properties).map(
                            (field) => (
                              <Badge key={field} variant="outline" className="text-xs">
                                {field}
                              </Badge>
                            )
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t('card.noFields')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-muted-foreground">{t('card.status')}</span>
                      <Badge variant={task.is_active ? 'default' : 'secondary'}>
                        {task.is_active ? t('status.active') : t('status.inactive')}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {t('card.created')} {new Date(task.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <TaskForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingTask(null)
        }}
        onSubmit={handleSubmit}
        initialData={editingTask || undefined}
        isEdit={!!editingTask}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </PageWrapper>
  )
}

export default AgentTasksPage
