import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import GeneralTab from './components/GeneralTab'
import SourcesTab from './components/SourcesTab'

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your application preferences and integrations
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralTab />
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <SourcesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SettingsPage
