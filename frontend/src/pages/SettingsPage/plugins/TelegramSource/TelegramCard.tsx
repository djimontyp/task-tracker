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
import { useTelegramStore } from '@/pages/SettingsPage/plugins/TelegramSource/useTelegramStore'

const TelegramCard = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  // Connection status from shared Zustand store
  const connectionStatus = useTelegramStore((state) => state.connectionStatus)
  const connectionError = useTelegramStore((state) => state.connectionError)

  const {
    isActive,
    groups,
    isLoadingConfig,
    handleDeleteWebhook,
    isDeletingWebhook,
    handleSetWebhook,
    isSettingWebhook,
    webhookBaseUrl,
    defaultBaseUrl,
  } = useTelegramSettings()

  // Note: checkRealStatus is called internally by loadConfig() in useTelegramSettings
  // No need for additional useEffect here - it was causing race conditions

  // Map connectionStatus to SourceCard status
  // Status is always based on real Telegram API check, not cached state
  const getStatus = () => {
    if (isLoadingConfig) return 'inactive'
    if (isSettingWebhook || isDeletingWebhook) return 'inactive'
    if (connectionStatus === 'checking') return 'inactive'
    if (connectionStatus === 'connected') return 'active'
    if (connectionStatus === 'warning') return 'error' // Show warning as error (yellow pending indicator)
    if (connectionStatus === 'error') {
      // Differentiate between "not configured" and "connection error"
      if (!connectionError || connectionError === 'No webhook URL configured') {
        return 'not-configured'
      }
      return 'error' // Has config but unreachable
    }
    // 'unknown' = initial state or after certain operations
    return 'not-configured'
  }

  const getStatusLabel = () => {
    if (isLoadingConfig) return 'Loading...'
    if (isSettingWebhook) return 'Activating...'
    if (isDeletingWebhook) return 'Deactivating...'
    if (connectionStatus === 'checking') return 'Checking...'
    if (connectionStatus === 'connected') return `Connected • ${groups.length} group${groups.length !== 1 ? 's' : ''}`
    if (connectionStatus === 'warning') return 'Pending updates'
    if (connectionStatus === 'error') {
      // Differentiate between "not configured" and "unreachable"
      if (!connectionError || connectionError === 'No webhook URL configured') {
        return 'Not configured'
      }
      // URL is configured but unreachable
      return 'Connection error'
    }
    // 'unknown' = not configured
    return 'Not configured'
  }

  const status = getStatus()
  const statusLabel = getStatusLabel()

  const handleToggle = async () => {
    if (isActive) {
      setIsConfirmDialogOpen(true)
    } else {
      // Check if we have a valid production URL to activate
      // localhost/127.0.0.1 are not valid for Telegram webhooks
      const effectiveUrl = webhookBaseUrl || defaultBaseUrl
      const isLocalhost = effectiveUrl?.includes('localhost') || effectiveUrl?.includes('127.0.0.1')
      const hasValidUrl = effectiveUrl && !isLocalhost

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
