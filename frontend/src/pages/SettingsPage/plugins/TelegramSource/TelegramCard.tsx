import { useState } from 'react'
import { TelegramIcon } from '@/shared/icons'
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
    handleDeleteWebhook,
    isDeletingWebhook,
    handleSetWebhook,
    isSettingWebhook,
    webhookBaseUrl,
    defaultBaseUrl,
  } = useTelegramSettings()

  const handleToggle = async () => {
    if (isActive) {
      setIsConfirmDialogOpen(true)
    } else {
      // Check if we have a valid production URL to activate
      // localhost/127.0.0.1 are not valid for Telegram webhooks
      const effectiveUrl = webhookBaseUrl || defaultBaseUrl
      const _isLocalhost = effectiveUrl?.includes('localhost') || effectiveUrl?.includes('127.0.0.1')
      const hasValidUrl = effectiveUrl && !_isLocalhost

      if (!hasValidUrl) {
        // No valid URL - open settings sheet for configuration
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
        icon={TelegramIcon}
        name="Telegram"
        description="Bot integration & groups management"
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
