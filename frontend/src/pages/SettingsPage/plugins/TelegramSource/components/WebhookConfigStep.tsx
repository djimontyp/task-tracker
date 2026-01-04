import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { FormField } from '@/shared/patterns'
import { AlertTriangle, Check, Clipboard } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'

const WEBHOOK_PATH = '/webhook/telegram'

interface WebhookConfigStepProps {
  webhookBaseUrl: string
  onWebhookBaseUrlChange: (value: string) => void
  defaultBaseUrl: string
  computedWebhookUrl: string
  isValidBaseUrl: boolean
  isSettingWebhook: boolean
  isSaving: boolean
  onActivate: () => Promise<void>
}

export function WebhookConfigStep({
  webhookBaseUrl,
  onWebhookBaseUrlChange,
  defaultBaseUrl,
  computedWebhookUrl,
  isValidBaseUrl,
  isSettingWebhook,
  isSaving,
  onActivate,
}: WebhookConfigStepProps) {
  const { t } = useTranslation('settings')
  const { t: tCommon } = useTranslation()
  const [hostValidationError, setHostValidationError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleHostChange = (value: string) => {
    // Auto-strip protocol prefix when pasting URL
    const cleanedValue = value.replace(/^https?:\/\//i, '')
    setHostValidationError(null)
    onWebhookBaseUrlChange(cleanedValue)
  }

  const handleCopyUrl = async () => {
    if (!computedWebhookUrl) return
    try {
      await navigator.clipboard.writeText(computedWebhookUrl)
      setCopied(true)
      toast.success(tCommon('toast.success.copied', { text: tCommon('toast.entities.webhookUrl') }))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(tCommon('toast.error.copyFailed'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('telegram.wizard.webhook.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('telegram.wizard.webhook.description')}
        </p>
      </div>

      <FormField
        label={t('telegram.wizard.webhook.hostLabel')}
        id="wizard-webhook-url"
        description={t('telegram.wizard.webhook.hostDescription', { path: WEBHOOK_PATH })}
        error={hostValidationError || undefined}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0 flex-1">
            <span className="inline-flex items-center px-4 h-10 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md">
              https://
            </span>
            <Input
              id="wizard-webhook-url"
              placeholder={defaultBaseUrl?.replace(/^https?:\/\//, '') || t('telegram.wizard.webhook.hostPlaceholder')}
              value={webhookBaseUrl.replace(/^https?:\/\//, '')}
              onChange={(e) => handleHostChange(e.target.value)}
              autoComplete="off"
              aria-label={t('telegram.wizard.webhook.hostLabel')}
              className={cn(
                'flex-1 text-sm rounded-l-none',
                hostValidationError && 'border-semantic-error focus-visible:ring-semantic-error'
              )}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCopyUrl}
            disabled={!computedWebhookUrl}
            className="shrink-0"
            aria-label={copied ? tCommon('common.copied') : tCommon('common.copy')}
          >
            {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
          </Button>
        </div>
      </FormField>

      {/* Preview */}
      {computedWebhookUrl && !hostValidationError && (
        <div className="p-4 rounded-md bg-muted/50 border">
          <p className="text-xs text-muted-foreground mb-2">{t('telegram.wizard.webhook.fullUrlLabel')}</p>
          <p className="text-sm font-mono break-all">{computedWebhookUrl}</p>
        </div>
      )}

      {/* HTTPS notice */}
      <div className="flex items-start gap-2 p-4 rounded-md bg-semantic-warning/10 border border-semantic-warning/20">
        <AlertTriangle className="h-4 w-4 text-semantic-warning flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          {t('telegram.wizard.webhook.httpsNotice')}
        </p>
      </div>

      {/* Activate button */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={onActivate}
          disabled={isSaving || isSettingWebhook || !isValidBaseUrl || !!hostValidationError}
        >
          {isSaving || isSettingWebhook ? t('telegram.wizard.webhook.activating') : t('telegram.wizard.webhook.activate')}
        </Button>
      </div>
    </div>
  )
}

export default WebhookConfigStep
