import type { Meta, StoryObj } from '@storybook/react'
import DashboardMetrics from './DashboardMetrics'
import { createMockMetrics, EMPTY_METRICS } from '../mocks/dashboardMocks'

const meta: Meta<typeof DashboardMetrics> = {
  title: 'Features/Dashboard/DashboardMetrics',
  component: DashboardMetrics,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof DashboardMetrics>

export const Default: Story = {
  args: {
    data: createMockMetrics(),
    isLoading: false,
  },
}

export const WithPositiveDeltas: Story = {
  args: {
    data: createMockMetrics({
      critical: { count: 5, delta: 3 },
      ideas: { count: 12, delta: 8 },
      decisions: { count: 20, delta: 5 },
      questions: { count: 8, delta: 4 },
    }),
    isLoading: false,
  },
}

export const WithNegativeDeltas: Story = {
  args: {
    data: createMockMetrics({
      critical: { count: 2, delta: -1 },
      ideas: { count: 5, delta: -3 },
      decisions: { count: 8, delta: -2 },
      questions: { count: 3, delta: -1 },
    }),
    isLoading: false,
  },
}

export const HighActivity: Story = {
  args: {
    data: createMockMetrics({
      critical: { count: 8, delta: 5 },
      ideas: { count: 15, delta: 10 },
      decisions: { count: 25, delta: 8 },
      questions: { count: 12, delta: 6 },
    }),
    isLoading: false,
  },
}

export const ZeroValues: Story = {
  args: {
    data: EMPTY_METRICS,
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
    error: new globalThis.Error('Failed to load metrics'),
  },
}
