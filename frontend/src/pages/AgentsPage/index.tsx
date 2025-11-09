import { AgentList } from '@/features/agents/components'
import { PageHeader } from '@/shared/components'

const AgentsPage = () => {
  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 animate-fade-in max-w-full overflow-hidden px-3 md:px-4">
      <PageHeader
        title="Agents"
        description="Configure AI agents, test prompts, and assign classification tasks"
      />

      <AgentList />
    </div>
  )
}

export default AgentsPage
