import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ChannelList, type ChannelInfo } from './ChannelList'

const meta: Meta<typeof ChannelList> = {
  title: 'Settings/Telegram/ChannelList',
  component: ChannelList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}
export default meta

type Story = StoryObj<typeof ChannelList>

const mockChannels: ChannelInfo[] = [
  { id: -1001234567890, name: 'Development Team' },
  { id: -1001234567891, name: 'General Chat' },
  { id: -1001234567892 }, // No name yet
]

const Template = (args: Parameters<typeof ChannelList>[0]) => {
  const [channels, setChannels] = useState(args.channels)
  const [newChannelId, setNewChannelId] = useState(args.newChannelId)
  const [inputValidation, setInputValidation] = useState<'valid' | 'invalid' | null>(null)

  const handleNewChannelIdChange = (value: string) => {
    setNewChannelId(value)
    if (!value.trim()) {
      setInputValidation(null)
    } else if (/^-?\d+$/.test(value) && parseInt(value, 10) < 0) {
      setInputValidation('valid')
    } else {
      setInputValidation('invalid')
    }
  }

  return (
    <ChannelList
      {...args}
      channels={channels}
      newChannelId={newChannelId}
      onNewChannelIdChange={handleNewChannelIdChange}
      inputValidation={inputValidation}
      onAddChannel={() => {
        if (inputValidation === 'valid') {
          setChannels([...channels, { id: parseInt(newChannelId, 10) }])
          setNewChannelId('')
          setInputValidation(null)
        }
      }}
      onRemoveChannel={(id) => {
        setChannels(channels.filter(c => c.id !== id))
      }}
    />
  )
}

export const WithChannels: Story = {
  render: (args) => <Template {...args} />,
  args: {
    channels: mockChannels,
    newChannelId: '',
    inputValidation: null,
    isAddingChannel: false,
    isRefreshingNames: false,
    removingChannelIds: new Set(),
    onAddChannel: () => {},
    onRemoveChannel: () => {},
    onRefreshNames: () => {},
    onNewChannelIdChange: () => {},
  },
}

export const Empty: Story = {
  render: (args) => <Template {...args} />,
  args: {
    channels: [],
    newChannelId: '',
    inputValidation: null,
    isAddingChannel: false,
    isRefreshingNames: false,
    removingChannelIds: new Set(),
    onAddChannel: () => {},
    onRemoveChannel: () => {},
    onRefreshNames: () => {},
    onNewChannelIdChange: () => {},
  },
}

export const RefreshingNames: Story = {
  args: {
    channels: mockChannels,
    newChannelId: '',
    inputValidation: null,
    isAddingChannel: false,
    isRefreshingNames: true,
    removingChannelIds: new Set(),
    onAddChannel: () => {},
    onRemoveChannel: () => {},
    onRefreshNames: () => {},
    onNewChannelIdChange: () => {},
  },
}

export const RemovingChannel: Story = {
  args: {
    channels: mockChannels,
    newChannelId: '',
    inputValidation: null,
    isAddingChannel: false,
    isRefreshingNames: false,
    removingChannelIds: new Set([-1001234567891]),
    onAddChannel: () => {},
    onRemoveChannel: () => {},
    onRefreshNames: () => {},
    onNewChannelIdChange: () => {},
  },
}
