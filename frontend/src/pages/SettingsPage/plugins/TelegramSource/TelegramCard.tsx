import { useState } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import SourceCard from '../../components/SourceCard'
import TelegramSettingsSheet from './TelegramSettingsSheet'
import { useTelegramSettings } from './useTelegramSettings'

const TelegramCard = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const {
    isActive,
    groups,
    isLoadingConfig,
    handleDeleteWebhook,
    isDeletingWebhook,
    handleSetWebhook,
    isSettingWebhook,
    webhookBaseUrl,
    defaultBaseUrl
  } = useTelegramSettings()

  const status = isLoadingConfig ? 'inactive' : isActive ? 'active' : 'not-configured'
  const statusLabel = isLoadingConfig
    ? 'Loading...'
    : isSettingWebhook
    ? 'Activating...'
    : isDeletingWebhook
    ? 'Deactivating...'
    : isActive
    ? `Active • ${groups.length} group${groups.length !== 1 ? 's' : ''}`
    : 'Not configured'

  const handleToggle = async () => {
    if (isActive) {
      await handleDeleteWebhook()
    } else {
      if (!webhookBaseUrl && !defaultBaseUrl) {
        setIsSheetOpen(true)
      } else {
        await handleSetWebhook()
      }
    }
  }

  return (
    <>
      <SourceCard
        icon={ChatBubbleLeftRightIcon}
        name="Telegram"
        description="Bot integration & groups management"
        status={status}
        statusLabel={statusLabel}
        enabled={isActive && !isDeletingWebhook && !isSettingWebhook}
        onToggle={handleToggle}
        onSettings={() => setIsSheetOpen(true)}
      />
      <TelegramSettingsSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </>
  )
}

export default TelegramCard
