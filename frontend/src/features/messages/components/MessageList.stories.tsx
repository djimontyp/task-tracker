/**
 * MessageList Stories
 *
 * Displays a scrollable list of messages with:
 * - Date grouping (Today, Yesterday, etc.)
 * - Selection support (single + shift-click range)
 * - Infinite scroll
 * - Loading states
 * - Empty state
 * - Error state
 * - Scroll to top button
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageList } from './MessageList'
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

const meta: Meta<typeof MessageList> = {
  title: 'Features/Messages/MessageList',
  component: MessageList,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="h-screen">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MessageList>

// Mock messages with different dates
const createMessage = (id: number, hoursAgo: number, importance: number): Message => {
  const date = new Date()
  date.setHours(date.getHours() - hoursAgo)

  return {
    id,
    external_message_id: `msg_${id}`,
    content: `Message ${id}: ${importance >= 80 ? 'Critical discussion about production issue' : importance >= 50 ? 'Important project update' : 'Regular team communication'}`,
    author_id: (id % 5) + 1,
    author_name: ['Alice Johnson', 'Bob Smith', 'Carol White', 'David Brown', 'Eve Wilson'][id % 5],
    sent_at: date.toISOString(),
    source_id: 1,
    source_name: 'Telegram',
    analyzed: true,
    avatar_url: id % 3 === 0 ? `https://i.pravatar.cc/150?u=${id}` : null,
    persisted: true,
    noise_classification: importance >= 60 ? 'signal' : importance >= 30 ? 'weak_signal' : 'noise',
    importance_score: importance,
    topic_id: (id % 3) + 1,
    topic_name: ['Frontend', 'Backend', 'Mobile'][id % 3],
  }
}

const mockMessages: Message[] = [
  // Today (0-5 hours ago)
  createMessage(1, 1, 85),
  createMessage(2, 2, 65),
  createMessage(3, 3, 45),
  createMessage(4, 4, 90),
  createMessage(5, 5, 25),
  // Yesterday (24-30 hours ago)
  createMessage(6, 26, 70),
  createMessage(7, 27, 55),
  createMessage(8, 28, 35),
  // 3 days ago (72 hours)
  createMessage(9, 72, 60),
  createMessage(10, 73, 40),
]

export const Default: Story = {
  args: {
    messages: mockMessages,
    isLoading: false,
    selectedId: null,
    selectedIds: {},
    onSelect: (id: string, shiftKey: boolean) => console.log('Select:', id, shiftKey),
    onToggleSelect: (id: string, checked: boolean) => console.log('Toggle:', id, checked),
    onCreateAtom: (id: string) => console.log('Create atom:', id),
    onDismiss: (id: string) => console.log('Dismiss:', id),
  },
}

export const Loading: Story = {
  args: {
    messages: [],
    isLoading: true,
    selectedId: null,
    selectedIds: {},
    onSelect: (id: string) => console.log('Select:', id),
    onToggleSelect: (id: string, checked: boolean) => console.log('Toggle:', id, checked),
  },
}

export const EmptyState: Story = {
  args: {
    messages: [],
    isLoading: false,
    selectedId: null,
    selectedIds: {},
    onSelect: (id: string) => console.log('Select:', id),
    onToggleSelect: (id: string, checked: boolean) => console.log('Toggle:', id, checked),
  },
}

export const ErrorState: Story = {
  args: {
    messages: [],
    isLoading: false,
    isError: true,
    error: new Error('Failed to load messages'),
    selectedId: null,
    selectedIds: {},
    onSelect: (id: string) => console.log('Select:', id),
    onToggleSelect: (id: string, checked: boolean) => console.log('Toggle:', id, checked),
    onRetry: () => console.log('Retry loading'),
  },
}

export const WithSelection: Story = {
  args: {
    messages: mockMessages,
    isLoading: false,
    selectedId: '2',
    selectedIds: {
      '2': true,
      '3': true,
      '4': true,
    },
    onSelect: (id: string) => console.log('Select:', id),
    onToggleSelect: (id: string, checked: boolean) => console.log('Toggle:', id, checked),
    onCreateAtom: (id: string) => console.log('Create atom:', id),
    onDismiss: (id: string) => console.log('Dismiss:', id),
  },
}

export const WithActiveMessage: Story = {
  args: {
    messages: mockMessages,
    isLoading: false,
    selectedId: '3',
    selectedIds: {
      '3': true,
    },
    onSelect: (id: string) => console.log('Select:', id),
    onToggleSelect: (id: string, checked: boolean) => console.log('Toggle:', id, checked),
    onCreateAtom: (id: string) => console.log('Create atom:', id),
    onDismiss: (id: string) => console.log('Dismiss:', id),
  },
}

export const InfiniteScrollWithMore: Story = {
  args: {
    messages: mockMessages,
    isLoading: false,
    selectedId: null,
    selectedIds: {},
    onSelect: (id: string) => console.log('Select:', id),
    onToggleSelect: (id: string, checked: boolean) => console.log('Toggle:', id, checked),
    hasMore: true,
    onLoadMore: () => console.log('Load more...'),
    isFetchingNextPage: false,
  },
}

export const InfiniteScrollLoading: Story = {
  args: {
    messages: mockMessages,
    isLoading: false,
    selectedId: null,
    selectedIds: {},
    onSelect: (id: string) => console.log('Select:', id),
    onToggleSelect: (id: string, checked: boolean) => console.log('Toggle:', id, checked),
    hasMore: true,
    onLoadMore: () => console.log('Load more...'),
    isFetchingNextPage: true,
  },
}

export const LongList: Story = {
  args: {
    messages: Array.from({ length: 50 }, (_, i) => createMessage(i + 1, i * 2, 50 + (i % 40))),
    isLoading: false,
    selectedId: null,
    selectedIds: {},
    onSelect: (id: string) => console.log('Select:', id),
    onToggleSelect: (id: string, checked: boolean) => console.log('Toggle:', id, checked),
    onCreateAtom: (id: string) => console.log('Create atom:', id),
    onDismiss: (id: string) => console.log('Dismiss:', id),
    hasMore: true,
    onLoadMore: () => console.log('Load more...'),
  },
}

export const HighImportanceOnly: Story = {
  args: {
    messages: [
      createMessage(1, 1, 95),
      createMessage(2, 2, 88),
      createMessage(3, 3, 92),
      createMessage(4, 26, 85),
      createMessage(5, 27, 90),
    ],
    isLoading: false,
    selectedId: null,
    selectedIds: {},
    onSelect: (id: string) => console.log('Select:', id),
    onToggleSelect: (id: string, checked: boolean) => console.log('Toggle:', id, checked),
    onCreateAtom: (id: string) => console.log('Create atom:', id),
    onDismiss: (id: string) => console.log('Dismiss:', id),
  },
}

export const NoiseOnly: Story = {
  args: {
    messages: [
      createMessage(1, 1, 15),
      createMessage(2, 2, 20),
      createMessage(3, 3, 10),
      createMessage(4, 26, 25),
      createMessage(5, 27, 18),
    ],
    isLoading: false,
    selectedId: null,
    selectedIds: {},
    onSelect: (id: string) => console.log('Select:', id),
    onToggleSelect: (id: string, checked: boolean) => console.log('Toggle:', id, checked),
    onCreateAtom: (id: string) => console.log('Create atom:', id),
    onDismiss: (id: string) => console.log('Dismiss:', id),
  },
}
