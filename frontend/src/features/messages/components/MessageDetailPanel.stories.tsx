/**
 * MessageDetailPanel Stories
 *
 * Displays detailed message inspection with:
 * - Message content and metadata
 * - AI analysis and reasoning
 * - Connected knowledge (atoms, entities, keywords)
 * - Navigation controls (prev/next)
 * - Loading states
 * - Error handling
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageDetailPanel } from './MessageDetailPanel'
import type { MessageInspectData } from '@/features/messages/types'

// Mock fetch to return static data
const mockFetch = (data: MessageInspectData | null, delay = 100) => {
  return (_url: string) => {
    return new Promise<Response>((resolve, reject) => {
      setTimeout(() => {
        if (!data) {
          reject(new Error('Failed to fetch message details'))
          return
        }
        resolve({
          ok: true,
          json: async () => data,
          status: 200,
          statusText: 'OK',
        } as Response)
      }, delay)
    })
  }
}

const meta: Meta<typeof MessageDetailPanel> = {
  title: 'Features/Messages/MessageDetailPanel',
  component: MessageDetailPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MessageDetailPanel>

const mockData: MessageInspectData = {
  message: {
    id: 'msg_123',
    content: 'We need to discuss the new React performance optimization strategy. The current implementation has some bottlenecks that are affecting load times.',
    source: 'telegram',
    created_at: '2025-01-06T10:30:00Z',
    sent_at: '2025-01-06T10:30:00Z',
    author_name: 'John Doe',
    avatar_url: 'https://i.pravatar.cc/150?u=john',
    topic_name: 'Frontend',
    telegram_message_id: 12345,
  },
  classification: {
    confidence: 0.85,
    reasoning: 'This message contains technical discussion about performance optimization, which is a high-priority topic for the Frontend team. The mention of specific bottlenecks indicates actionable items.',
    topic_id: 't_1',
    topic_title: 'Frontend',
    noise_score: 0.15,
    urgency_score: 0.75,
    importance_score: 80,
    noise_classification: 'signal',
  },
  atoms: {
    entities: {
      people: ['John Doe', 'Alice Smith'],
      places: [],
      organizations: ['React Team'],
      concepts: ['Performance Optimization', 'Load Times', 'Bottlenecks'],
    },
    keywords: [
      { text: 'react', relevance: 95 },
      { text: 'performance', relevance: 90 },
      { text: 'optimization', relevance: 85 },
      { text: 'bottlenecks', relevance: 80 },
      { text: 'load times', relevance: 75 },
    ],
  },
  history: [
    {
      timestamp: '2025-01-06T10:30:00Z',
      action: 'classified',
      to_topic: 'Frontend',
      admin_user: 'AI Agent',
    },
    {
      timestamp: '2025-01-06T10:31:00Z',
      action: 'approved',
      admin_user: 'Admin',
      reason: 'Relevant for sprint planning',
    },
  ],
}

export const Default: Story = {
  args: {
    messageId: 'msg_123',
    onClose: () => console.log('Close'),
    onNext: () => console.log('Next'),
    onPrev: () => console.log('Previous'),
  },
  beforeEach: () => {
    global.fetch = mockFetch(mockData) as typeof global.fetch
  },
}

export const Loading: Story = {
  args: {
    messageId: 'msg_123',
    onClose: () => console.log('Close'),
    onNext: () => console.log('Next'),
    onPrev: () => console.log('Previous'),
  },
  beforeEach: () => {
    global.fetch = mockFetch(mockData, 10000) as typeof global.fetch // Long delay to show loading
  },
}

export const ErrorState: Story = {
  args: {
    messageId: 'msg_invalid',
    onClose: () => console.log('Close'),
    onNext: () => console.log('Next'),
    onPrev: () => console.log('Previous'),
  },
  beforeEach: () => {
    global.fetch = mockFetch(null) as typeof global.fetch // Trigger error
  },
}

export const NoMessageSelected: Story = {
  args: {
    messageId: '',
    onClose: () => console.log('Close'),
  },
}

export const FirstMessage: Story = {
  args: {
    messageId: 'msg_123',
    onClose: () => console.log('Close'),
    onNext: () => console.log('Next'),
    onPrev: undefined, // No previous
  },
  beforeEach: () => {
    global.fetch = mockFetch(mockData) as typeof global.fetch
  },
}

export const LastMessage: Story = {
  args: {
    messageId: 'msg_123',
    onClose: () => console.log('Close'),
    onNext: undefined, // No next
    onPrev: () => console.log('Previous'),
  },
  beforeEach: () => {
    global.fetch = mockFetch(mockData) as typeof global.fetch
  },
}

export const MiddleMessage: Story = {
  args: {
    messageId: 'msg_123',
    onClose: () => console.log('Close'),
    onNext: () => console.log('Next'),
    onPrev: () => console.log('Previous'),
  },
  beforeEach: () => {
    global.fetch = mockFetch(mockData) as typeof global.fetch
  },
}

export const NoReasoning: Story = {
  args: {
    messageId: 'msg_123',
    onClose: () => console.log('Close'),
    onNext: () => console.log('Next'),
    onPrev: () => console.log('Previous'),
  },
  beforeEach: () => {
    global.fetch = mockFetch({
      ...mockData,
      classification: {
        ...mockData.classification,
        reasoning: 'No reasoning available',
      },
    }) as typeof global.fetch
  },
}

export const MinimalData: Story = {
  args: {
    messageId: 'msg_123',
    onClose: () => console.log('Close'),
    onNext: () => console.log('Next'),
    onPrev: () => console.log('Previous'),
  },
  beforeEach: () => {
    global.fetch = mockFetch({
      message: {
        id: 'msg_minimal',
        content: 'Simple message',
        source: 'manual',
        created_at: '2025-01-06T10:30:00Z',
      },
      classification: {
        confidence: 0.5,
        reasoning: 'No reasoning available',
        topic_id: '',
        topic_title: '',
        noise_score: 0.5,
        urgency_score: 0.3,
      },
      atoms: {
        entities: {
          people: [],
          places: [],
          organizations: [],
          concepts: [],
        },
        keywords: [],
      },
      history: [],
    }) as typeof global.fetch
  },
}

export const RichEntities: Story = {
  args: {
    messageId: 'msg_123',
    onClose: () => console.log('Close'),
    onNext: () => console.log('Next'),
    onPrev: () => console.log('Previous'),
  },
  beforeEach: () => {
    global.fetch = mockFetch({
      ...mockData,
      atoms: {
        entities: {
          people: ['John Doe', 'Alice Smith', 'Bob Johnson', 'Carol White'],
          places: ['New York', 'London', 'Tokyo'],
          organizations: ['React Team', 'Google', 'Meta', 'Microsoft'],
          concepts: ['Performance', 'Optimization', 'React', 'TypeScript', 'Webpack', 'Vite'],
        },
        keywords: [
          { text: 'react', relevance: 95 },
          { text: 'performance', relevance: 92 },
          { text: 'optimization', relevance: 88 },
          { text: 'typescript', relevance: 85 },
          { text: 'webpack', relevance: 80 },
          { text: 'vite', relevance: 78 },
          { text: 'bundler', relevance: 75 },
          { text: 'build', relevance: 72 },
        ],
      },
    }) as typeof global.fetch
  },
}

export const LongContent: Story = {
  args: {
    messageId: 'msg_123',
    onClose: () => console.log('Close'),
    onNext: () => console.log('Next'),
    onPrev: () => console.log('Previous'),
  },
  beforeEach: () => {
    global.fetch = mockFetch({
      ...mockData,
      message: {
        ...mockData.message,
        content: `This is a very long message that contains detailed technical discussion about React performance optimization strategies.

We need to address several critical issues:

1. Component re-rendering - too many unnecessary re-renders in the dashboard
2. Memory leaks in WebSocket connections
3. Large bundle sizes affecting initial load time
4. Unoptimized images causing slow page loads

Proposed solutions:
- Implement React.memo for expensive components
- Use useMemo and useCallback hooks appropriately
- Code splitting with React.lazy
- Image optimization with next/image or similar
- WebSocket connection pooling

This will require coordination between frontend and backend teams. We should schedule a technical planning session this week to discuss implementation details and timeline.`,
      },
      classification: {
        ...mockData.classification,
        reasoning: 'This message contains comprehensive technical discussion with specific action items and proposed solutions. It mentions multiple technical concepts and requires coordination between teams. High importance and urgency scores reflect the critical nature of performance issues and the need for immediate action.',
      },
    }) as typeof global.fetch
  },
}
