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
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Verify Connection</h3>
        <p className="text-sm text-muted-foreground">
          Test your webhook connection to ensure everything is working correctly.
        </p>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-4 p-4 rounded-md bg-muted/50 border">
        {webhookActivated ? (
          <>
            <CheckCircle className="h-6 w-6 text-semantic-success flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Webhook Activated</p>
              <p className="text-xs text-muted-foreground">
                Your webhook has been registered with Telegram
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="h-6 w-6 text-semantic-warning flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Webhook Not Configured</p>
              <p className="text-xs text-muted-foreground">
                Go back to configure your webhook URL first
              </p>
            </div>
          </>
        )}
      </div>

      {/* Test connection */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Test Connection</h4>
        <p className="text-sm text-muted-foreground">
          Click the button below to verify that Telegram can reach your webhook URL.
        </p>
        <TestConnectionButton
          onTest={onTestConnection}
          disabled={!webhookActivated}
        />
      </div>

      {/* Next steps */}
      <div className="p-4 rounded-md bg-primary/5 border border-primary/10">
        <h4 className="font-medium text-sm mb-2">What&apos;s Next?</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Add the bot to your Telegram channels as an admin</li>
          <li>• Add channel IDs to start monitoring messages</li>
          <li>• Messages will appear in your dashboard automatically</li>
        </ul>
      </div>
    </div>
  )
}

export default VerifyConnectionStep
