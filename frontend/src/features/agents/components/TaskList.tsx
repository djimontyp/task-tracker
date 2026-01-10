import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  Button,
  Badge,
  Spinner,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui'
import { taskService } from '@/features/agents/api'
import { TaskConfig, TaskConfigCreate, TaskConfigUpdate } from '@/features/agents/types'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, ClipboardList } from 'lucide-react'
import { EmptyState } from '@/shared/patterns'
import { TaskForm } from './TaskForm'

const TaskList = () => {
  const { t } = useTranslation('agents')
  const { t: tCommon } = useTranslation()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskConfig | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: tasks, isLoading } = useQuery<TaskConfig[]>({
    queryKey: ['task-configs'],
    queryFn: () => taskService.listTasks(),
  })

  const createMutation = useMutation({
    mutationFn: (data: TaskConfigCreate) => taskService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-configs'] })
      toast.success(t('taskList.toast.createSuccess'))
      setFormOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || t('taskList.toast.createError'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskConfigUpdate }) =>
      taskService.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-configs'] })
      toast.success(t('taskList.toast.updateSuccess'))
      setFormOpen(false)
      setEditingTask(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || t('taskList.toast.updateError'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-configs'] })
      toast.success(t('taskList.toast.deleteSuccess'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('taskList.toast.deleteError'))
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

  const handleDeleteClick = (id: string) => {
    setDeleteId(id)
  }

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId)
      setDeleteId(null)
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
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('taskList.title')}</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('taskList.addButton')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks?.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              variant="card"
              icon={ClipboardList}
              title={t('taskList.empty.title')}
              description={t('taskList.empty.description')}
              action={
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('taskList.addButton')}
                </Button>
              }
            />
          </div>
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
                        aria-label={t('taskList.actions.edit')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(task.id)}
                        aria-label={t('taskList.actions.delete')}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('taskList.fields.schemaFields')}</span>
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
                            {t('taskList.fields.noFields')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-muted-foreground">{t('taskList.fields.status')}</span>
                      <Badge variant={task.is_active ? 'default' : 'secondary'}>
                        {task.is_active ? t('status.active') : t('status.inactive')}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {t('taskList.fields.created')} {new Date(task.created_at).toLocaleDateString()}
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirmDialog.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tCommon('confirmDialog.deleteTask')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              {tCommon('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export { TaskList }
