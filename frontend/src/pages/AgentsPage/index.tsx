import AgentList from './components/AgentList'

const AgentsPage = () => {
  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">AI Agents</h1>
        <p className="text-muted-foreground">
          Configure and manage AI agents for automated analysis
        </p>
      </div>

      <AgentList />
    </div>
  )
}

export default AgentsPage
