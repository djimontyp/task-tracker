import { useWizardStore } from '../store/wizardStore'
import { Label } from '@/shared/ui/label'
import { Input } from '@/shared/ui/input'
import { Switch } from '@/shared/ui/switch'
import { Slider } from '@/shared/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { useTestEmail, useTestTelegram } from '../api/automationService'
import { toast } from 'sonner'

export function NotificationsConfigStep() {
  const { formData, updateNotifications } = useWizardStore()
  const testEmailMutation = useTestEmail()
  const testTelegramMutation = useTestTelegram()

  const handleEmailToggle = (enabled: boolean) => {
    updateNotifications({ email_enabled: enabled })
  }

  const handleEmailChange = (email: string) => {
    updateNotifications({ email_address: email })
  }

  const handleTelegramToggle = (enabled: boolean) => {
    updateNotifications({ telegram_enabled: enabled })
  }

  const handleTelegramChatIdChange = (chatId: string) => {
    updateNotifications({ telegram_chat_id: chatId })
  }

  const handleThresholdChange = (values: number[]) => {
    updateNotifications({ pending_threshold: values[0] })
  }

  const handleDigestToggle = (enabled: boolean) => {
    updateNotifications({ digest_enabled: enabled })
  }

  const handleDigestFrequencyChange = (frequency: 'daily' | 'weekly') => {
    updateNotifications({ digest_frequency: frequency })
  }

  const handleTestEmail = async () => {
    try {
      const result = await testEmailMutation.mutateAsync()
      if (result.success) {
        toast.success('Test email sent successfully!')
      } else {
        toast.error(result.message || 'Failed to send test email')
      }
    } catch (error) {
      toast.error('Failed to send test email')
    }
  }

  const handleTestTelegram = async () => {
    try {
      const result = await testTelegramMutation.mutateAsync()
      if (result.success) {
        toast.success('Test notification sent successfully!')
      } else {
        toast.error(result.message || 'Failed to send test notification')
      }
    } catch (error) {
      toast.error('Failed to send test notification')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Notification Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure how and when you want to be notified about automation events
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                <EnvelopeIcon className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
            </div>
            <Switch
              checked={formData.notifications.email_enabled}
              onCheckedChange={handleEmailToggle}
            />
          </div>

          {formData.notifications.email_enabled && (
            <div className="space-y-3 pt-2">
              <div>
                <Label htmlFor="email-address" className="text-sm">
                  Email Address
                </Label>
                <Input
                  id="email-address"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.notifications.email_address || ''}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestEmail}
                disabled={!formData.notifications.email_address || testEmailMutation.isPending}
                className="w-full"
              >
                {testEmailMutation.isPending ? 'Sending...' : 'Send Test Email'}
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="size-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <Label className="text-sm font-medium">Telegram Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive updates via Telegram
                </p>
              </div>
            </div>
            <Switch
              checked={formData.notifications.telegram_enabled}
              onCheckedChange={handleTelegramToggle}
            />
          </div>

          {formData.notifications.telegram_enabled && (
            <div className="space-y-3 pt-2">
              <div>
                <Label htmlFor="telegram-chat-id" className="text-sm">
                  Chat ID
                </Label>
                <Input
                  id="telegram-chat-id"
                  type="text"
                  placeholder="123456789"
                  value={formData.notifications.telegram_chat_id || ''}
                  onChange={(e) => handleTelegramChatIdChange(e.target.value)}
                  className="mt-1.5 font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Start a chat with the bot to get your Chat ID
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestTelegram}
                disabled={!formData.notifications.telegram_chat_id || testTelegramMutation.isPending}
                className="w-full"
              >
                {testTelegramMutation.isPending ? 'Sending...' : 'Send Test Notification'}
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Alert Threshold</Label>
              <Badge variant="outline" className="font-mono">
                {formData.notifications.pending_threshold} pending
              </Badge>
            </div>
            <Slider
              value={[formData.notifications.pending_threshold]}
              onValueChange={handleThresholdChange}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Get notified when pending versions exceed this count
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <Label className="text-sm font-medium">Daily Digest</Label>
              <p className="text-xs text-muted-foreground">
                Receive summary reports
              </p>
            </div>
            <Switch
              checked={formData.notifications.digest_enabled}
              onCheckedChange={handleDigestToggle}
            />
          </div>

          {formData.notifications.digest_enabled && (
            <div>
              <Label className="text-sm">Digest Frequency</Label>
              <Select
                value={formData.notifications.digest_frequency}
                onValueChange={handleDigestFrequencyChange}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily (every morning)</SelectItem>
                  <SelectItem value="weekly">Weekly (every Monday)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
