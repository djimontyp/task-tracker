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
  useTestEmail,
} from '../api/automationService'

export function EmailConfigCard() {
  const { data: preferences, isLoading } = useNotificationPreferences()
  const updateMutation = useUpdateNotificationPreferences()
  const testMutation = useTestEmail()

  const [emailEnabled, setEmailEnabled] = useState(preferences?.email_enabled ?? false)
  const [emailAddress, setEmailAddress] = useState(preferences?.email_address || '')

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        email_enabled: emailEnabled,
        email_address: emailAddress,
      })
      toast.success('Email settings saved')
    } catch (error) {
      toast.error('Failed to save email settings')
    }
  }

  const handleTest = async () => {
    try {
      const result = await testMutation.mutateAsync()
      if (result.success) {
        toast.success('Test email sent successfully')
      } else {
        toast.error(result.message || 'Failed to send test email')
      }
    } catch (error) {
      toast.error('Failed to send test email')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
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
        <CardTitle>Email Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-enabled">Enable email notifications</Label>
          <Switch
            id="email-enabled"
            checked={emailEnabled}
            onCheckedChange={setEmailEnabled}
          />
        </div>

        {emailEnabled && (
          <div className="space-y-2">
            <Label htmlFor="email-address">Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="email-address"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="notifications@example.com"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={!emailAddress || testMutation.isPending}
              >
                {testMutation.isPending ? 'Sending...' : 'Test'}
              </Button>
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  )
}
