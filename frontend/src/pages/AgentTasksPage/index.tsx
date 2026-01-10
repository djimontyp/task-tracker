import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  Button,
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
import { Plus } from 'lucide-react'
import { TaskForm, TaskTemplateCard } from '@/features/agents/components'
import { PageWrapper } from '@/shared/primitives'

const AgentTasksPage = () => {
  const { t } = useTranslation('agentTasks')
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
            <TaskTemplateCard
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
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
    </PageWrapper>
  )
}

export default AgentTasksPage
