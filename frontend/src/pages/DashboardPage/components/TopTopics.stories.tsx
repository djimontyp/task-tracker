import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import TopTopics from './TopTopics'
import { createMockTopics, EMPTY_TOPICS } from '../mocks/dashboardMocks'

const meta: Meta<typeof TopTopics> = {
  title: 'Features/Dashboard/TopTopics',
  component: TopTopics,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof TopTopics>

export const Default: Story = {
  args: {
    data: createMockTopics(5),
    isLoading: false,
  },
}

export const VariousIcons: Story = {
  args: {
    data: [
      { id: '1', name: 'Mobile Development', icon: 'Smartphone', color: '#3B82F6', atomCount: 42, messageCount: 256 },
      { id: '2', name: 'Backend API', icon: 'Server', color: '#10B981', atomCount: 38, messageCount: 189 },
      { id: '3', name: 'DevOps', icon: 'Container', color: '#F59E0B', atomCount: 25, messageCount: 134 },
      { id: '4', name: 'Design System', icon: 'Palette', color: '#8B5CF6', atomCount: 19, messageCount: 98 },
      { id: '5', name: 'Security', icon: 'Shield', color: '#EF4444', atomCount: 15, messageCount: 67 },
    ],
    isLoading: false,
  },
}

export const FewTopics: Story = {
  args: {
    data: createMockTopics(3),
    isLoading: false,
    limit: 3,
  },
}

export const SingleTopic: Story = {
  args: {
    data: createMockTopics(1),
    isLoading: false,
    limit: 1,
  },
}

export const Empty: Story = {
  args: {
    data: EMPTY_TOPICS,
    isLoading: false,
  },
}

export const Loading: Story = {
  args: {
    data: undefined,
    isLoading: true,
  },
}

export const ErrorState: Story = {
  args: {
    data: undefined,
    isLoading: false,
    error: new globalThis.Error('Failed to load topics'),
  },
}
