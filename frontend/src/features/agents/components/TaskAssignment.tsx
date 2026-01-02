import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Spinner,
  Badge,
  Checkbox,
  Label,
} from '@/shared/ui'
import { AgentConfig } from '@/features/agents/types'
import { AgentTaskAssignment } from '@/features/agents/types'
import { agentService } from '@/features/agents/api'
import { taskService } from '@/features/agents/api'
import { toast } from 'sonner'

interface TaskAssignmentProps {
  agent: AgentConfig | null
  open: boolean
  onClose: () => void
}

const TaskAssignment = ({ agent, open, onClose }: TaskAssignmentProps) => {
  const { t } = useTranslation('agents')
  const queryClient = useQueryClient()
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())

  const { data: allTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'active'],
    queryFn: () => taskService.listTasks({ active_only: true }),
    enabled: open && !!agent,
  })

  const { data: assignedTasks, isLoading: assignedLoading } = useQuery<
    AgentTaskAssignment[]
  >({
    queryKey: ['agent-tasks', agent?.id],
    queryFn: () => agentService.getAgentTasks(agent!.id),
    enabled: open && !!agent,
  })

  useEffect(() => {
    if (assignedTasks) {
      setSelectedTasks(new Set(assignedTasks.map((at) => at.task_id)))
    }
  }, [assignedTasks])

  const assignMutation = useMutation({
    mutationFn: (taskId: string) =>
      agentService.assignTask(agent!.id, { task_id: taskId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-tasks', agent?.id] })
      toast.success(t('taskAssignment.toast.assignSuccess'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('taskAssignment.toast.assignError'))
    },
  })

  const unassignMutation = useMutation({
    mutationFn: (taskId: string) => agentService.unassignTask(agent!.id, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-tasks', agent?.id] })
      toast.success(t('taskAssignment.toast.unassignSuccess'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('taskAssignment.toast.unassignError'))
    },
  })

  const handleToggleTask = (taskId: string) => {
    const isCurrentlyAssigned = selectedTasks.has(taskId)

    if (isCurrentlyAssigned) {
      unassignMutation.mutate(taskId)
    } else {
      assignMutation.mutate(taskId)
    }
  }

  const isLoading = tasksLoading || assignedLoading
  const isMutating = assignMutation.isPending || unassignMutation.isPending

  if (!agent) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] md:max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('taskAssignment.title', { name: agent.name })}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            {allTasks?.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {t('taskAssignment.noTasks')}
              </p>
            ) : (
              allTasks?.map((task) => {
                const isAssigned = selectedTasks.has(task.id)
                return (
                  <div
                    key={task.id}
                    className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-accent/5"
                  >
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={isAssigned}
                      onCheckedChange={() => handleToggleTask(task.id)}
                      disabled={isMutating}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`task-${task.id}`}
                        className="cursor-pointer font-medium"
                      >
                        {task.name}
                      </Label>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {task.description}
                        </p>
                      )}
                      <Badge variant="outline" className="mt-2">
                        {isAssigned ? t('taskAssignment.assigned') : t('taskAssignment.notAssigned')}
                      </Badge>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('actions.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { TaskAssignment }
