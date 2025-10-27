import { EmailConfigCard } from '@/features/automation/components/EmailConfigCard'
import { TelegramConfigCard } from '@/features/automation/components/TelegramConfigCard'
import { AlertThresholdsCard } from '@/features/automation/components/AlertThresholdsCard'

export default function NotificationSettingsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure email, Telegram, and alert preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmailConfigCard />
        <TelegramConfigCard />
      </div>

      <AlertThresholdsCard />
    </div>
  )
}
