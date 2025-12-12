import { AgentList } from '@/features/agents/components'
import { PageWrapper } from '@/shared/primitives'

const AgentsPage = () => {
  return (
    <PageWrapper variant="fullWidth">
      <AgentList />
    </PageWrapper>
  )
}

export default AgentsPage
