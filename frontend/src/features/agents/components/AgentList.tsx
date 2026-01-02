import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('agents')
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null)
  const [copyingAgent, setCopyingAgent] = useState<Partial<AgentConfigCreate> | null>(null)
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
      toast.success(t('toast.createSuccess'))
      setFormOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.createError'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgentConfigUpdate }) =>
      agentService.updateAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success(t('toast.updateSuccess'))
      setFormOpen(false)
      setEditingAgent(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.updateError'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentService.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success(t('toast.deleteSuccess'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.deleteError'))
    },
  })

  const handleCreate = () => {
    setEditingAgent(null)
    setCopyingAgent(null)
    setFormOpen(true)
  }

  const handleEdit = (agent: AgentConfig) => {
    setEditingAgent(agent)
    setCopyingAgent(null)
    setFormOpen(true)
  }

  const handleCopy = (agent: AgentConfig) => {
    const copyData: Partial<AgentConfigCreate> = {
      name: `${agent.name} (Copy)`,
      description: agent.description,
      provider_id: agent.provider_id,
      model_name: agent.model_name,
      system_prompt: agent.system_prompt,
      temperature: agent.temperature,
      max_tokens: agent.max_tokens,
      is_active: agent.is_active,
    }
    setCopyingAgent(copyData)
    setEditingAgent(null)
    setFormOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm(t('confirm.deleteAgent'))) {
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
        <h2 className="text-2xl font-bold">{t('list.title')}</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('list.addButton')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-4">
        {agents?.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              variant="card"
              icon={Cpu}
              title={t('list.empty.title')}
              description={t('list.empty.description')}
              action={
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('list.addButton')}
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
              onCopy={handleCopy}
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
          setCopyingAgent(null)
        }}
        onSubmit={handleSubmit}
        initialData={editingAgent || copyingAgent || undefined}
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
