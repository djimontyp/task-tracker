import type { Meta, StoryObj } from '@storybook/react'
import { StatusDisplay } from './StatusDisplay'

const meta: Meta<typeof StatusDisplay> = {
  title: 'Settings/Telegram/StatusDisplay',
  component: StatusDisplay,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['connected', 'disconnected', 'error', 'loading'],
    },
    showLabel: {
      control: 'boolean',
    },
  },
}
export default meta

type Story = StoryObj<typeof StatusDisplay>

export const Connected: Story = {
  args: {
    status: 'connected',
  },
}

export const Disconnected: Story = {
  args: {
    status: 'disconnected',
  },
}

export const Error: Story = {
  args: {
    status: 'error',
  },
}

export const Loading: Story = {
  args: {
    status: 'loading',
  },
}

export const IconOnly: Story = {
  args: {
    status: 'connected',
    showLabel: false,
  },
}
