import type { Meta, StoryObj } from '@storybook/react'
import { InstructionsCard } from './InstructionsCard'

const meta: Meta<typeof InstructionsCard> = {
  title: 'Settings/Telegram/InstructionsCard',
  component: InstructionsCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}
export default meta

type Story = StoryObj<typeof InstructionsCard>

export const Default: Story = {}
