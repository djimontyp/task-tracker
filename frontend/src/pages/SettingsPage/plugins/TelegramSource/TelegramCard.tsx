import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
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
  Button,
} from '@/shared/ui'
import SourceCard from '@/pages/SettingsPage/components/SourceCard'
import TelegramSettingsSheet from '@/pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet'
import { HistoryImportDialog } from '@/pages/SettingsPage/plugins/TelegramSource/components/HistoryImportDialog'
import { useTelegramSettings } from '@/pages/SettingsPage/plugins/TelegramSource/useTelegramSettings'

const TelegramCard = () => {
  const { t } = useTranslation('settings')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

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
        actions={
          isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportDialogOpen(true)}
              aria-label={t('telegram.historyImport.buttonAriaLabel')}
            >
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              {t('telegram.historyImport.button')}
            </Button>
          )
        }
      />
      <TelegramSettingsSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
      <HistoryImportDialog
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
      />

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('telegram.disableDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('telegram.disableDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('telegram.disableDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDisable}>
              {t('telegram.disableDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default TelegramCard
