import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import GeneralTab from './components/GeneralTab'
import SourcesTab from './components/SourcesTab'
import PromptTuningTab from './components/PromptTuningTab'
import { PageHeader } from '@/shared/components'
import { useAdminMode } from '@/shared/hooks'

const SettingsPage = () => {
  const { isAdminMode } = useAdminMode()

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
          {isAdminMode && <TabsTrigger value="prompts">Prompt Tuning</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralTab />
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <SourcesTab />
        </TabsContent>

        {isAdminMode && (
          <TabsContent value="prompts" className="space-y-4">
            <PromptTuningTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default SettingsPage
