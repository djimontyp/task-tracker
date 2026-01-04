import { useTranslation } from 'react-i18next'
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

interface ConnectionErrorStateProps {
  webhookUrl: string
  errorMessage: string | null
  onRetry: () => void
  isRetrying: boolean
  className?: string
}

export function ConnectionErrorState({
  webhookUrl,
  errorMessage,
  onRetry,
  isRetrying,
  className,
}: ConnectionErrorStateProps) {
  const { t } = useTranslation('settings')

  return (
    <Alert variant="destructive" className={cn('relative', className)}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t('telegram.wizard.connection.errorTitle')}</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>{t('telegram.wizard.connection.errorDescription')}</p>

        <div className="space-y-2 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{t('telegram.wizard.connection.urlLabel')}</span>
            <code className="block bg-destructive/10 px-2 py-0.5 rounded text-xs break-all">
              {webhookUrl}
            </code>
          </div>

          {errorMessage && (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{t('telegram.wizard.connection.errorLabel')}</span>
              <span className="text-destructive-foreground/80">{errorMessage}</span>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
          className="w-full border-destructive/30 hover:bg-destructive/10"
        >
          {isRetrying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('telegram.wizard.connection.checking')}
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('telegram.wizard.connection.retryConnection')}
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export default ConnectionErrorState
