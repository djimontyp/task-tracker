import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConnectionErrorState } from './ConnectionErrorState'

const meta: Meta<typeof ConnectionErrorState> = {
  title: 'Settings/Telegram/ConnectionErrorState',
  component: ConnectionErrorState,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    onRetry: () => console.log('onRetry clicked'),
  },
  argTypes: {
    isRetrying: {
      control: 'boolean',
    },
    errorMessage: {
      control: 'text',
    },
    webhookUrl: {
      control: 'text',
    },
  },
}
export default meta

type Story = StoryObj<typeof ConnectionErrorState>

export const Default: Story = {
  args: {
    webhookUrl: 'https://40deb4ee4b4b.ngrok-free.app/webhook/telegram',
    errorMessage: 'ngrok tunnel not active (error: ERR_NGROK_3200)',
    isRetrying: false,
  },
}

export const Retrying: Story = {
  args: {
    webhookUrl: 'https://40deb4ee4b4b.ngrok-free.app/webhook/telegram',
    errorMessage: 'ngrok tunnel not active (error: ERR_NGROK_3200)',
    isRetrying: true,
  },
}

export const LongUrl: Story = {
  args: {
    webhookUrl:
      'https://very-long-subdomain-name-for-testing.eu.ngrok.io/api/v1/webhook/telegram',
    errorMessage: 'Connection timed out after 30 seconds',
    isRetrying: false,
  },
}

export const NoErrorMessage: Story = {
  args: {
    webhookUrl: 'https://example.ngrok-free.app/webhook/telegram',
    errorMessage: null,
    isRetrying: false,
  },
}

export const GenericError: Story = {
  args: {
    webhookUrl: 'https://my-server.com/webhook/telegram',
    errorMessage: 'Webhook URL is not reachable',
    isRetrying: false,
  },
}
