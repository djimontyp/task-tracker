import type { Meta, StoryObj } from '@storybook/react'
import { BotInfoCard } from './BotInfoCard'

const meta: Meta<typeof BotInfoCard> = {
  title: 'Settings/Telegram/BotInfoCard',
  component: BotInfoCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}
export default meta

type Story = StoryObj<typeof BotInfoCard>

export const Default: Story = {}
