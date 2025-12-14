import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Bot, MessageSquare, CheckCircle, Users } from 'lucide-react'
import { BOT_USERNAME } from '../types'

const INSTRUCTIONS = [
  {
    icon: Bot,
    title: 'Add bot to your channel',
    description: `Add ${BOT_USERNAME} as an administrator to your Telegram channel or group`,
  },
  {
    icon: Users,
    title: 'Grant permissions',
    description: 'Ensure the bot has permission to read messages in the channel',
  },
  {
    icon: MessageSquare,
    title: 'Configure webhook',
    description: 'Enter your server URL below to receive messages from Telegram',
  },
  {
    icon: CheckCircle,
    title: 'Test connection',
    description: 'Send a test message in your channel to verify the integration works',
  },
]

export function InstructionsCard() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">How to connect Telegram</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {INSTRUCTIONS.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium flex items-center gap-2 text-sm">
                  <step.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  {step.title}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

export default InstructionsCard
