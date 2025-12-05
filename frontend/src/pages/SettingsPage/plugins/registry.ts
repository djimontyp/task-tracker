import type { ComponentType } from 'react'
import { MessageSquare } from 'lucide-react'
import TelegramCard from './TelegramSource/TelegramCard'

export interface SourcePlugin {
  id: string
  name: string
  icon: ComponentType<{ className?: string }>
  description: string
  CardComponent: ComponentType
}

export const sourcePlugins: SourcePlugin[] = [
  {
    id: 'telegram',
    name: 'Telegram',
    icon: MessageSquare,
    description: 'Bot integration & groups management',
    CardComponent: TelegramCard,
  },
]
