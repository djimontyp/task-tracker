import { useState, useEffect } from 'react'
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
      toast.success('Task assigned successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign task')
    },
  })

  const unassignMutation = useMutation({
    mutationFn: (taskId: string) => agentService.unassignTask(agent!.id, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-tasks', agent?.id] })
      toast.success('Task unassigned successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unassign task')
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
          <DialogTitle>Manage Tasks for {agent.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            {allTasks?.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No tasks available. Create tasks first.
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
                        {isAssigned ? 'Assigned' : 'Not Assigned'}
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
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TaskAssignment
