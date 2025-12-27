import type { Meta, StoryObj } from '@storybook/react-vite'
import TrendsList from './TrendsList'
import { createMockTrends, EMPTY_TRENDS } from '../mocks/dashboardMocks'

const meta: Meta<typeof TrendsList> = {
  title: 'Features/Dashboard/TrendsList',
  component: TrendsList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof TrendsList>

export const Default: Story = {
  args: {
    data: createMockTrends(5, 'week'),
    isLoading: false,
  },
}

export const WithProblems: Story = {
  args: {
    data: {
      period: 'week',
      trends: [
        { keyword: 'Критичний баг', count: 15, delta: 10, relatedProblems: 3 },
        { keyword: 'API інтеграція', count: 12, delta: 5, relatedProblems: 1 },
        { keyword: 'Рефакторинг', count: 8, delta: 0 },
        { keyword: 'Документація', count: 5, delta: -2 },
      ],
    },
    isLoading: false,
  },
}

export const FewTrends: Story = {
  args: {
    data: createMockTrends(2, 'today'),
    isLoading: false,
  },
}

export const Empty: Story = {
  args: {
    data: EMPTY_TRENDS,
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
    error: new globalThis.Error('Failed to load trends'),
  },
}

export const WithShowAllButton: Story = {
  args: {
    data: createMockTrends(5, 'week'),
    isLoading: false,
    onShowAll: () => alert('Show all trends clicked'),
  },
}
