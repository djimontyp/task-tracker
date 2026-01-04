import { useTranslation } from 'react-i18next'
import { TestConnectionButton, type TestResult } from './TestConnectionButton'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface VerifyConnectionStepProps {
  onTestConnection: () => Promise<TestResult | null>
  webhookActivated: boolean
}

export function VerifyConnectionStep({
  onTestConnection,
  webhookActivated,
}: VerifyConnectionStepProps) {
  const { t } = useTranslation('settings')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('telegram.wizard.verify.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('telegram.wizard.verify.description')}
        </p>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-4 p-4 rounded-md bg-muted/50 border">
        {webhookActivated ? (
          <>
            <CheckCircle className="h-6 w-6 text-semantic-success flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{t('telegram.wizard.verify.webhookActivated.title')}</p>
              <p className="text-xs text-muted-foreground">
                {t('telegram.wizard.verify.webhookActivated.description')}
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="h-6 w-6 text-semantic-warning flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{t('telegram.wizard.verify.webhookNotConfigured.title')}</p>
              <p className="text-xs text-muted-foreground">
                {t('telegram.wizard.verify.webhookNotConfigured.description')}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Test connection */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">{t('telegram.wizard.verify.testTitle')}</h4>
        <p className="text-sm text-muted-foreground">
          {t('telegram.wizard.verify.testDescription')}
        </p>
        <TestConnectionButton
          onTest={onTestConnection}
          disabled={!webhookActivated}
        />
      </div>

      {/* Next steps */}
      <div className="p-4 rounded-md bg-primary/5 border border-primary/10">
        <h4 className="font-medium text-sm mb-2">{t('telegram.wizard.verify.whatsNext.title')}</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• {t('telegram.wizard.verify.whatsNext.addBotToChannels')}</li>
          <li>• {t('telegram.wizard.verify.whatsNext.addChannelIds')}</li>
          <li>• {t('telegram.wizard.verify.whatsNext.messagesAppear')}</li>
        </ul>
      </div>
    </div>
  )
}

export default VerifyConnectionStep
