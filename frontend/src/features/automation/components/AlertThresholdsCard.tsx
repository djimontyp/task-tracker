import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../api/automationService'

export function AlertThresholdsCard() {
  const { data: preferences, isLoading } = useNotificationPreferences()
  const updateMutation = useUpdateNotificationPreferences()

  const [pendingThreshold, setPendingThreshold] = useState(
    preferences?.pending_threshold?.toString() || '20'
  )
  const [digestEnabled, setDigestEnabled] = useState(preferences?.daily_digest_enabled ?? false)
  const [digestTime, setDigestTime] = useState(preferences?.digest_time || '09:00')
  const [digestFrequency, setDigestFrequency] = useState<'daily' | 'weekly'>(
    preferences?.digest_frequency || 'daily'
  )

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        pending_threshold: parseInt(pendingThreshold, 10),
        daily_digest_enabled: digestEnabled,
        digest_time: digestTime,
        digest_frequency: digestFrequency,
      })
      toast.success('Alert settings saved')
    } catch (error) {
      toast.error('Failed to save alert settings')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alert Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Thresholds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pending-threshold">Notify if pending versions exceed</Label>
          <Input
            id="pending-threshold"
            type="number"
            value={pendingThreshold}
            onChange={(e) => setPendingThreshold(e.target.value)}
            min={1}
            max={1000}
          />
          <p className="text-xs text-muted-foreground">
            Send alert when pending versions exceed this threshold
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="digest-enabled">Enable digest notifications</Label>
            <Switch
              id="digest-enabled"
              checked={digestEnabled}
              onCheckedChange={setDigestEnabled}
            />
          </div>

          {digestEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="digest-frequency">Frequency</Label>
                <Select value={digestFrequency} onValueChange={(v: 'daily' | 'weekly') => setDigestFrequency(v)}>
                  <SelectTrigger id="digest-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="digest-time">Send at (UTC)</Label>
                <Input
                  id="digest-time"
                  type="time"
                  value={digestTime}
                  onChange={(e) => setDigestTime(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  )
}
