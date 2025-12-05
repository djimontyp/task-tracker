import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui'
import SourceCard from '@/pages/SettingsPage/components/SourceCard'
import TelegramSettingsSheet from '@/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet'
import { useTelegramSettings } from '@/pages/SettingsPage/plugins/TelegramSource/useTelegramSettings'

const TelegramCard = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
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
      setIsConfirmDialogOpen(true)
    } else {
      if (!webhookBaseUrl && !defaultBaseUrl) {
        setIsSheetOpen(true)
      } else {
        await handleSetWebhook()
      }
    }
  }

  const handleConfirmDisable = async () => {
    setIsConfirmDialogOpen(false)
    await handleDeleteWebhook()
  }

  return (
    <>
      <SourceCard
        icon={MessageSquare}
        name="Telegram"
        description="Bot integration & groups management"
        status={status}
        statusLabel={statusLabel}
        enabled={isActive && !isDeletingWebhook && !isSettingWebhook}
        onToggle={handleToggle}
        onSettings={() => setIsSheetOpen(true)}
      />
      <TelegramSettingsSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Telegram webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the webhook from Telegram and stop processing incoming messages. You can re-enable it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDisable}>
              Disable webhook
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default TelegramCard
