import type { ComponentType } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
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
    icon: ChatBubbleLeftRightIcon,
    description: 'Bot integration & groups management',
    CardComponent: TelegramCard,
  },
]
