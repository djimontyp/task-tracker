import { BotInfoCard } from './BotInfoCard'
import { InstructionsCard } from './InstructionsCard'

export function BotInfoStep() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Welcome to Telegram Integration</h3>
        <p className="text-sm text-muted-foreground">
          Follow these steps to connect your Telegram channels to Pulse Radar.
        </p>
      </div>

      <BotInfoCard />
      <InstructionsCard />
    </div>
  )
}

export default BotInfoStep
