import { AgentList } from '@/features/agents/components'
import { PageHeader } from '@/shared/components'
import { PageWrapper } from '@/shared/primitives'

const AgentsPage = () => {
  return (
    <PageWrapper variant="fullWidth">
      <PageHeader
        title="Agents"
        description="Configure AI agents, test prompts, and assign classification tasks"
      />

      <AgentList />
    </PageWrapper>
  )
}

export default AgentsPage
