import type { Meta, StoryObj } from '@storybook/react'
import { TestConnectionButton } from './TestConnectionButton'

const meta: Meta<typeof TestConnectionButton> = {
  title: 'Settings/Telegram/TestConnectionButton',
  component: TestConnectionButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}
export default meta

type Story = StoryObj<typeof TestConnectionButton>

export const Default: Story = {
  args: {
    onTest: async () => {
      await new Promise(resolve => setTimeout(resolve, 1500))
      return {
        success: true,
        webhookUrl: 'https://example.com/webhook/telegram',
        pendingUpdateCount: 0,
      }
    },
  },
}

export const SuccessResult: Story = {
  args: {
    onTest: async () => ({
      success: true,
      webhookUrl: 'https://example.com/webhook/telegram',
      pendingUpdateCount: 5,
      message: 'Webhook is active and responding',
    }),
  },
}

export const ErrorResult: Story = {
  args: {
    onTest: async () => ({
      success: false,
      lastErrorMessage: 'Connection timed out',
      message: 'Failed to reach webhook URL',
    }),
  },
}

export const Disabled: Story = {
  args: {
    onTest: async () => null,
    disabled: true,
  },
}
