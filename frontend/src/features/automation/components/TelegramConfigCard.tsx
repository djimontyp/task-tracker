import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useTestTelegram,
} from '../api/automationService'

export function TelegramConfigCard() {
  const { data: preferences, isLoading } = useNotificationPreferences()
  const updateMutation = useUpdateNotificationPreferences()
  const testMutation = useTestTelegram()

  const [telegramEnabled, setTelegramEnabled] = useState(preferences?.telegram_enabled ?? false)
  const [telegramChatId, setTelegramChatId] = useState(preferences?.telegram_chat_id || '')

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        telegram_enabled: telegramEnabled,
        telegram_chat_id: telegramChatId,
      })
      toast.success('Telegram settings saved')
    } catch (error) {
      toast.error('Failed to save Telegram settings')
    }
  }

  const handleTest = async () => {
    try {
      const result = await testMutation.mutateAsync()
      if (result.success) {
        toast.success('Test message sent successfully')
      } else {
        toast.error(result.message || 'Failed to send test message')
      }
    } catch (error) {
      toast.error('Failed to send test message')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Telegram Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="telegram-enabled">Enable Telegram notifications</Label>
          <Switch
            id="telegram-enabled"
            checked={telegramEnabled}
            onCheckedChange={setTelegramEnabled}
          />
        </div>

        {telegramEnabled && (
          <div className="space-y-2">
            <Label htmlFor="telegram-chat-id">Chat ID</Label>
            <div className="flex gap-2">
              <Input
                id="telegram-chat-id"
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="123456789"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={!telegramChatId || testMutation.isPending}
              >
                {testMutation.isPending ? 'Sending...' : 'Test'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your Chat ID from @userinfobot on Telegram
            </p>
          </div>
        )}

        <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  )
}
