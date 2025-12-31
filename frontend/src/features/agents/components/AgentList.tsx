import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Spinner } from '@/shared/ui'
import { agentService } from '@/features/agents/api'
import { AgentConfig, AgentConfigCreate, AgentConfigUpdate } from '@/features/agents/types'
import { toast } from 'sonner'
import { Plus, Cpu } from 'lucide-react'
import { EmptyState } from '@/shared/patterns'
import { AgentForm } from './AgentForm'
import { AgentCard } from './AgentCard'
import { TaskAssignment } from './TaskAssignment'
import { AgentTestDialog } from './AgentTestDialog'

const AgentList = () => {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null)
  const [managingAgent, setManagingAgent] = useState<AgentConfig | null>(null)
  const [testingAgent, setTestingAgent] = useState<AgentConfig | null>(null)

  const { data: agents, isLoading } = useQuery<AgentConfig[]>({
    queryKey: ['agents'],
    queryFn: () => agentService.listAgents(),
  })

  const createMutation = useMutation({
    mutationFn: (data: AgentConfigCreate) => agentService.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent created successfully')
      setFormOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create agent')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgentConfigUpdate }) =>
      agentService.updateAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent updated successfully')
      setFormOpen(false)
      setEditingAgent(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update agent')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentService.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete agent')
    },
  })

  const handleCreate = () => {
    setEditingAgent(null)
    setFormOpen(true)
  }

  const handleEdit = (agent: AgentConfig) => {
    setEditingAgent(agent)
    setFormOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleManageTasks = (agent: AgentConfig) => {
    setManagingAgent(agent)
  }

  const handleTest = (agent: AgentConfig) => {
    setTestingAgent(agent)
  }

  const handleSubmit = (data: AgentConfigCreate | AgentConfigUpdate) => {
    if (editingAgent) {
      updateMutation.mutate({ id: editingAgent.id, data })
    } else {
      createMutation.mutate(data as AgentConfigCreate)
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
        <h2 className="text-2xl font-bold">AI Agents</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-4">
        {agents?.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              variant="card"
              icon={Cpu}
              title="No agents found"
              description="Create your first AI agent to start automating tasks."
              action={
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Agent
                </Button>
              }
            />
          </div>
        ) : (
          agents?.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onManageTasks={handleManageTasks}
              onTest={handleTest}
              isDeleting={deleteMutation.isPending}
            />
          ))
        )}
      </div>

      <AgentForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingAgent(null)
        }}
        onSubmit={handleSubmit}
        initialData={editingAgent || undefined}
        isEdit={!!editingAgent}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <TaskAssignment
        agent={managingAgent}
        open={!!managingAgent}
        onClose={() => setManagingAgent(null)}
      />

      <AgentTestDialog
        agent={testingAgent}
        open={!!testingAgent}
        onClose={() => setTestingAgent(null)}
      />
    </div>
  )
}

export { AgentList }
