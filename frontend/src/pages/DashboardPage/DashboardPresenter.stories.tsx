/**
 * DashboardPresenter Stories
 *
 * Demonstrates the pure presentational component in isolation.
 * Easy to test all UI states without actual API calls.
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'

import { DashboardPresenter } from './DashboardPresenter'
import type {
  DashboardMetricsData,
  FocusAtom,
  RecentInsight,
  TopTopic,
} from './types'

const meta: Meta<typeof DashboardPresenter> = {
  title: 'Pages/Dashboard/DashboardPresenter',
  component: DashboardPresenter,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    onCloseOnboarding: () => console.log('Close onboarding'),
    onNavigateToSettings: () => console.log('Navigate to settings'),
    onNavigateToMessages: () => console.log('Navigate to messages'),
    onNavigateToTopics: () => console.log('Navigate to topics'),
  },
}

export default meta
type Story = StoryObj<typeof DashboardPresenter>

// Mock data
const mockMetrics: DashboardMetricsData = {
  critical: { count: 12, delta: 3 },
  ideas: { count: 45, delta: -2 },
  decisions: { count: 8, delta: 1 },
  questions: { count: 15, delta: 0 },
}

const mockInsights: RecentInsight[] = [
  {
    id: '1',
    type: 'PROBLEM',
    title: 'Database performance degradation',
    content: 'Query latency increased by 200ms after recent deployment',
    author: 'System',
    topicName: 'Infrastructure',
    topicId: 'topic-1',
    createdAt: new Date().toISOString(),
    importance: 0.9,
  },
  {
    id: '2',
    type: 'DECISION',
    title: 'Switch to Redis for caching',
    content: 'Team decided to implement Redis instead of Memcached',
    author: 'System',
    topicName: 'Architecture',
    topicId: 'topic-2',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    importance: 0.8,
  },
  {
    id: '3',
    type: 'INSIGHT',
    title: 'User engagement increased 40%',
    content: 'After implementing new onboarding flow',
    author: 'System',
    topicName: 'Product',
    topicId: 'topic-3',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    importance: 0.75,
  },
]

const mockTopics: TopTopic[] = [
  {
    id: '1',
    name: 'Infrastructure',
    icon: 'Server',
    color: '#EF4444',
    atomCount: 23,
    messageCount: 156,
    lastActivityAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Architecture',
    icon: 'Building',
    color: '#3B82F6',
    atomCount: 18,
    messageCount: 89,
    lastActivityAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: '3',
    name: 'Product',
    icon: 'Package',
    color: '#10B981',
    atomCount: 15,
    messageCount: 67,
    lastActivityAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '4',
    name: 'Security',
    icon: 'Shield',
    color: '#F59E0B',
    atomCount: 12,
    messageCount: 45,
    lastActivityAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '5',
    name: 'DevOps',
    icon: 'GitBranch',
    color: '#8B5CF6',
    atomCount: 9,
    messageCount: 34,
    lastActivityAt: new Date(Date.now() - 14400000).toISOString(),
  },
]

const mockFocusAtoms: FocusAtom[] = [
  {
    id: 1,
    title: 'Review API rate limits',
    atom_type: 'TASK',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Add dark mode toggle',
    atom_type: 'IDEA',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'What triggers the webhook?',
    atom_type: 'QUESTION',
    created_at: new Date().toISOString(),
  },
]

/**
 * Default state with data loaded
 */
export const Default: Story = {
  args: {
    metrics: {
      data: mockMetrics,
      isLoading: false,
      error: null,
    },
    insights: {
      data: mockInsights,
      isLoading: false,
      error: null,
    },
    topics: {
      data: mockTopics,
      isLoading: false,
      error: null,
    },
    focusAtoms: {
      data: mockFocusAtoms,
      isLoading: false,
      error: null,
    },
    hasNoData: false,
    isAnyLoading: false,
    showOnboarding: false,
    greeting: 'Доброго ранку, Макс!',
    subtitle: 'Є 12 сигналів що потребують уваги',
  },
}

/**
 * Loading state - all sections show skeletons
 */
export const Loading: Story = {
  args: {
    metrics: {
      data: undefined,
      isLoading: true,
      error: null,
    },
    insights: {
      data: undefined,
      isLoading: true,
      error: null,
    },
    topics: {
      data: undefined,
      isLoading: true,
      error: null,
    },
    focusAtoms: {
      data: undefined,
      isLoading: true,
      error: null,
    },
    hasNoData: false,
    isAnyLoading: true,
    showOnboarding: false,
    greeting: 'Доброго дня, Макс!',
    subtitle: 'Аналізую дані...',
  },
}

/**
 * Empty state - new user, no data yet
 */
export const EmptyState: Story = {
  args: {
    metrics: {
      data: {
        critical: { count: 0, delta: 0 },
        ideas: { count: 0, delta: 0 },
        decisions: { count: 0, delta: 0 },
        questions: { count: 0, delta: 0 },
      },
      isLoading: false,
      error: null,
    },
    insights: {
      data: [],
      isLoading: false,
      error: null,
    },
    topics: {
      data: [],
      isLoading: false,
      error: null,
    },
    focusAtoms: {
      data: [],
      isLoading: false,
      error: null,
    },
    hasNoData: true,
    isAnyLoading: false,
    showOnboarding: false,
    greeting: 'Доброго вечора, Макс!',
    subtitle: 'Тиша в ефірі. Підключіть джерела даних.',
  },
}

/**
 * With onboarding wizard shown
 */
export const WithOnboarding: Story = {
  args: {
    ...EmptyState.args,
    showOnboarding: true,
  },
}

/**
 * Error state - API failed
 */
export const WithError: Story = {
  args: {
    metrics: {
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch metrics'),
    },
    insights: {
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch insights'),
    },
    topics: {
      data: mockTopics,
      isLoading: false,
      error: null,
    },
    focusAtoms: {
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch focus atoms'),
    },
    hasNoData: false,
    isAnyLoading: false,
    showOnboarding: false,
    greeting: 'Доброго ранку, Макс!',
    subtitle: 'Проєкт рухається стабільно',
  },
}

/**
 * Partial loading - some data loaded, some still loading
 */
export const PartialLoading: Story = {
  args: {
    metrics: {
      data: mockMetrics,
      isLoading: false,
      error: null,
    },
    insights: {
      data: undefined,
      isLoading: true,
      error: null,
    },
    topics: {
      data: undefined,
      isLoading: true,
      error: null,
    },
    focusAtoms: {
      data: undefined,
      isLoading: true,
      error: null,
    },
    hasNoData: false,
    isAnyLoading: true,
    showOnboarding: false,
    greeting: 'Доброго дня, Макс!',
    subtitle: 'Аналізую дані...',
  },
}

/**
 * Afternoon greeting variant
 */
export const AfternoonGreeting: Story = {
  args: {
    ...Default.args,
    greeting: 'Доброго дня, Макс!',
    subtitle: 'Проєкт рухається стабільно 🚀',
  },
}

/**
 * Evening greeting variant
 */
export const EveningGreeting: Story = {
  args: {
    ...Default.args,
    greeting: 'Доброго вечора, Макс!',
    subtitle: '3 інсайти очікують на розгляд',
  },
}

/**
 * Stable state - no critical issues
 */
export const StableProject: Story = {
  args: {
    ...Default.args,
    metrics: {
      data: {
        critical: { count: 0, delta: -2 },
        ideas: { count: 45, delta: 5 },
        decisions: { count: 8, delta: 1 },
        questions: { count: 3, delta: -1 },
      },
      isLoading: false,
      error: null,
    },
    greeting: 'Доброго ранку, Макс!',
    subtitle: 'Проєкт рухається стабільно 🚀',
  },
}
