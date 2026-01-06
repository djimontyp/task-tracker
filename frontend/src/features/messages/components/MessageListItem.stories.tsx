/**
 * MessageListItem Stories
 *
 * Displays a single message in the message list with:
 * - Status indicator (signal/noise)
 * - Author avatar and name
 * - Content snippet
 * - Topic and importance badges
 * - Hover actions (create atom, dismiss)
 * - Selection checkbox
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageListItem } from './MessageListItem'
import type { Message } from '@/shared/types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock QueryClient for useScoringConfig hook
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
})

const meta: Meta<typeof MessageListItem> = {
  title: 'Features/Messages/MessageListItem',
  component: MessageListItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="max-w-3xl mx-auto">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MessageListItem>

// Base mock message
const baseMessage: Message = {
  id: 1,
  external_message_id: 'msg_123456',
  content: 'Discussion about React performance optimization techniques. We should consider using React.memo and useMemo for expensive calculations.',
  author_id: 42,
  author_name: 'John Doe',
  sent_at: new Date().toISOString(),
  source_id: 1,
  source_name: 'Telegram',
  analyzed: true,
  avatar_url: null,
  persisted: true,
  noise_classification: 'signal',
  importance_score: 75,
  topic_id: 1,
  topic_name: 'Frontend',
}

export const Default: Story = {
  args: {
    message: baseMessage,
    isSelected: false,
    isActive: false,
    onSelect: (checked, shiftKey) => console.log('Select:', checked, shiftKey),
    onClick: () => console.log('Click'),
    onCreateAtom: () => console.log('Create atom'),
    onDismiss: () => console.log('Dismiss'),
  },
}

export const Selected: Story = {
  args: {
    message: baseMessage,
    isSelected: true,
    isActive: false,
    onSelect: (checked, shiftKey) => console.log('Select:', checked, shiftKey),
    onClick: () => console.log('Click'),
    onCreateAtom: () => console.log('Create atom'),
    onDismiss: () => console.log('Dismiss'),
  },
}

export const Active: Story = {
  args: {
    message: baseMessage,
    isSelected: false,
    isActive: true,
    onSelect: (checked, shiftKey) => console.log('Select:', checked, shiftKey),
    onClick: () => console.log('Click'),
    onCreateAtom: () => console.log('Create atom'),
    onDismiss: () => console.log('Dismiss'),
  },
}

export const ErrorState: Story = {
  args: {
    message: baseMessage,
    isSelected: false,
    isActive: false,
    isError: true,
    error: new Error('Failed to load message details'),
    onSelect: (checked, shiftKey) => console.log('Select:', checked, shiftKey),
    onClick: () => console.log('Click'),
    onRetry: () => console.log('Retry'),
  },
}

export const LowImportance: Story = {
  args: {
    message: {
      ...baseMessage,
      content: 'Just a casual message with no important information.',
      importance_score: 20,
      noise_classification: 'noise',
    },
    isSelected: false,
    isActive: false,
    onSelect: (checked, shiftKey) => console.log('Select:', checked, shiftKey),
    onClick: () => console.log('Click'),
    onCreateAtom: () => console.log('Create atom'),
    onDismiss: () => console.log('Dismiss'),
  },
}

export const MediumImportance: Story = {
  args: {
    message: {
      ...baseMessage,
      content: 'Some moderately important update about the project status.',
      importance_score: 55,
      noise_classification: 'weak_signal',
    },
    isSelected: false,
    isActive: false,
    onSelect: (checked, shiftKey) => console.log('Select:', checked, shiftKey),
    onClick: () => console.log('Click'),
    onCreateAtom: () => console.log('Create atom'),
    onDismiss: () => console.log('Dismiss'),
  },
}

export const HighImportance: Story = {
  args: {
    message: {
      ...baseMessage,
      content: 'CRITICAL: Production deployment failed! Immediate action required.',
      importance_score: 95,
      noise_classification: 'signal',
    },
    isSelected: false,
    isActive: false,
    onSelect: (checked, shiftKey) => console.log('Select:', checked, shiftKey),
    onClick: () => console.log('Click'),
    onCreateAtom: () => console.log('Create atom'),
    onDismiss: () => console.log('Dismiss'),
  },
}

export const WithAvatar: Story = {
  args: {
    message: {
      ...baseMessage,
      avatar_url: 'https://i.pravatar.cc/150?u=john',
    },
    isSelected: false,
    isActive: false,
    onSelect: (checked, shiftKey) => console.log('Select:', checked, shiftKey),
    onClick: () => console.log('Click'),
    onCreateAtom: () => console.log('Create atom'),
    onDismiss: () => console.log('Dismiss'),
  },
}

export const WithoutTopic: Story = {
  args: {
    message: {
      ...baseMessage,
      topic_id: null,
      topic_name: null,
    },
    isSelected: false,
    isActive: false,
    onSelect: (checked, shiftKey) => console.log('Select:', checked, shiftKey),
    onClick: () => console.log('Click'),
    onCreateAtom: () => console.log('Create atom'),
    onDismiss: () => console.log('Dismiss'),
  },
}

export const LongContent: Story = {
  args: {
    message: {
      ...baseMessage,
      content: 'This is a very long message with lots of text that should be truncated after two lines. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    },
    isSelected: false,
    isActive: false,
    onSelect: (checked, shiftKey) => console.log('Select:', checked, shiftKey),
    onClick: () => console.log('Click'),
    onCreateAtom: () => console.log('Create atom'),
    onDismiss: () => console.log('Dismiss'),
  },
}

export const EmptyContent: Story = {
  args: {
    message: {
      ...baseMessage,
      content: '',
    },
    isSelected: false,
    isActive: false,
    onSelect: (checked, shiftKey) => console.log('Select:', checked, shiftKey),
    onClick: () => console.log('Click'),
    onCreateAtom: () => console.log('Create atom'),
    onDismiss: () => console.log('Dismiss'),
  },
}

export const NoImportanceScore: Story = {
  args: {
    message: {
      ...baseMessage,
      importance_score: undefined,
      noise_classification: undefined,
    },
    isSelected: false,
    isActive: false,
    onSelect: (checked, shiftKey) => console.log('Select:', checked, shiftKey),
    onClick: () => console.log('Click'),
    onCreateAtom: () => console.log('Create atom'),
    onDismiss: () => console.log('Dismiss'),
  },
}
