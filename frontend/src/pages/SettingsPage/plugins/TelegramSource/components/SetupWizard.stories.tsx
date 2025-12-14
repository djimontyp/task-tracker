import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SetupWizard } from './SetupWizard'
import type { TestResult } from './TestConnectionButton'

const meta: Meta<typeof SetupWizard> = {
  title: 'Settings/Telegram/SetupWizard',
  component: SetupWizard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}
export default meta

type Story = StoryObj<typeof SetupWizard>

// Interactive wrapper with state
function SetupWizardWrapper({
  initialUrl = '',
  simulateSuccess = true,
}: {
  initialUrl?: string
  simulateSuccess?: boolean
}) {
  const [webhookBaseUrl, setWebhookBaseUrl] = useState(initialUrl)
  const [isSettingWebhook, setIsSettingWebhook] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleUpdateWebhook = async () => {
    setIsSettingWebhook(true)
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSettingWebhook(false)
    setIsSaving(false)
  }

  const handleTestConnection = async (): Promise<TestResult | null> => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    if (simulateSuccess) {
      return {
        success: true,
        webhookUrl: `https://${webhookBaseUrl || 'example.com'}/webhook/telegram`,
        pendingUpdateCount: 0,
      }
    }
    return {
      success: false,
      message: 'Connection timeout - webhook URL not reachable',
    }
  }

  const handleComplete = () => {
    console.log('Setup completed!')
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <SetupWizard
        webhookBaseUrl={webhookBaseUrl}
        onWebhookBaseUrlChange={setWebhookBaseUrl}
        defaultBaseUrl="your-domain.com"
        computedWebhookUrl={`https://${webhookBaseUrl || 'your-domain.com'}/webhook/telegram`}
        isValidBaseUrl={webhookBaseUrl.length > 0 && !webhookBaseUrl.includes('://')}
        isSettingWebhook={isSettingWebhook}
        isSaving={isSaving}
        onUpdateWebhook={handleUpdateWebhook}
        onTestConnection={handleTestConnection}
        onComplete={handleComplete}
      />
    </div>
  )
}

export const Default: Story = {
  render: () => <SetupWizardWrapper />,
}

export const WithPrefilled: Story = {
  render: () => <SetupWizardWrapper initialUrl="my-server.ngrok.io" />,
}

export const SimulateError: Story = {
  render: () => <SetupWizardWrapper simulateSuccess={false} />,
}
