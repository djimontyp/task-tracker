import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/ui'
import AgentList from './components/AgentList'
import TaskList from './components/TaskList'
import ProviderList from './components/ProviderList'

const AgentsPage = () => {
  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 3xl:space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">LLM Agent Management</h1>
        <p className="text-muted-foreground">
          Manage AI agents, task configurations, and LLM providers
        </p>
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <AgentList />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <TaskList />
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <ProviderList />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AgentsPage
