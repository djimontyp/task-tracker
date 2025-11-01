import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import GeneralTab from './components/GeneralTab'
import SourcesTab from './components/SourcesTab'
import { PageHeader } from '@/shared/components'

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure application preferences and integrations"
      />

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
