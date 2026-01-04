import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { RefreshCw, CheckCircle, XCircle, Info } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export interface TestResult {
  success: boolean
  webhookUrl?: string | null
  pendingUpdateCount?: number
  lastErrorDate?: string | null
  lastErrorMessage?: string | null
  message?: string
}

interface TestConnectionButtonProps {
  onTest: () => Promise<TestResult | null>
  disabled?: boolean
}

export function TestConnectionButton({ onTest, disabled }: TestConnectionButtonProps) {
  const { t } = useTranslation('settings')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const handleTest = async () => {
    setIsLoading(true)
    setResult(null)
    try {
      const testResult = await onTest()
      setResult(testResult)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        onClick={handleTest}
        disabled={disabled || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            {t('telegram.wizard.test.testing')}
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('telegram.wizard.test.testConnection')}
          </>
        )}
      </Button>

      {result && (
        <Card className={cn(
          'p-4',
          result.success
            ? 'bg-semantic-success/10 border-semantic-success/20'
            : 'bg-semantic-error/10 border-semantic-error/20'
        )}>
          <div className="flex items-start gap-4">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-semantic-success flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-semantic-error flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <p className={cn(
                'font-medium text-sm',
                result.success ? 'text-semantic-success' : 'text-semantic-error'
              )}>
                {result.success ? t('telegram.wizard.test.success') : t('telegram.wizard.test.failed')}
              </p>

              {result.webhookUrl && (
                <div className="flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground break-all">
                    {t('telegram.wizard.test.webhookLabel')} {result.webhookUrl}
                  </p>
                </div>
              )}

              {typeof result.pendingUpdateCount === 'number' && (
                <p className="text-xs text-muted-foreground">
                  {t('telegram.wizard.test.pendingUpdates')} {result.pendingUpdateCount}
                </p>
              )}

              {result.lastErrorMessage && (
                <p className="text-xs text-semantic-error">
                  {t('telegram.wizard.test.lastError')} {result.lastErrorMessage}
                </p>
              )}

              {result.message && !result.success && (
                <p className="text-xs text-muted-foreground">
                  {result.message}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default TestConnectionButton
