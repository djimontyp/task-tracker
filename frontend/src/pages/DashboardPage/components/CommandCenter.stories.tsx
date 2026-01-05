import type { Meta, StoryObj } from '@storybook/react-vite'
import { CommandCenter } from './CommandCenter'
import type { MessageTrendPoint, ActivityDay } from '../types'

// Mock trend data for stories
const mockTrendData: MessageTrendPoint[] = [
  { date: '2024-01-01', displayDate: '1 Jan', signal: 45, noise: 20 },
  { date: '2024-01-02', displayDate: '2 Jan', signal: 52, noise: 18 },
  { date: '2024-01-03', displayDate: '3 Jan', signal: 38, noise: 25 },
  { date: '2024-01-04', displayDate: '4 Jan', signal: 60, noise: 15 },
  { date: '2024-01-05', displayDate: '5 Jan', signal: 55, noise: 22 },
]

// Mock activity data for stories
const mockActivityData: ActivityDay[] = [
  { date: new Date('2024-01-01'), count: 5, level: 1 },
  { date: new Date('2024-01-02'), count: 12, level: 2 },
  { date: new Date('2024-01-03'), count: 25, level: 3 },
  { date: new Date('2024-01-04'), count: 40, level: 4 },
  { date: new Date('2024-01-05'), count: 8, level: 1 },
  { date: new Date('2024-01-06'), count: 0, level: 0 },
  { date: new Date('2024-01-07'), count: 15, level: 2 },
]

const meta: Meta<typeof CommandCenter> = {
  title: 'Pages/Dashboard/CommandCenter',
  component: CommandCenter,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    connectionStatus: {
      control: 'select',
      options: ['healthy', 'warning', 'error'],
      description: 'Connection status indicator for the Pulse widget',
    },
  },
}

export default meta
type Story = StoryObj<typeof CommandCenter>

/**
 * Default state with healthy connection.
 * Shows the Pulse indicator with green dot and "Pulse" label.
 */
export const Connected: Story = {
  args: {
    greeting: 'Good morning, Max!',
    subtitle: 'Project is moving steadily',
    trendData: mockTrendData,
    trendLoading: false,
    activityData: mockActivityData,
    activityLoading: false,
    activeSignalsCount: 12,
    connectionStatus: 'healthy',
  },
}

/**
 * Disconnected state with error status.
 * Shows the Pulse indicator with red dot and "Server connection lost" label.
 */
export const Disconnected: Story = {
  args: {
    greeting: 'Good morning, Max!',
    subtitle: 'Connection issues detected',
    trendData: mockTrendData,
    trendLoading: false,
    activityData: mockActivityData,
    activityLoading: false,
    activeSignalsCount: 5,
    connectionStatus: 'error',
  },
}

/**
 * Warning state - treated same as error for visual feedback.
 */
export const Warning: Story = {
  args: {
    greeting: 'Good afternoon, Max!',
    subtitle: 'Some services are slow',
    trendData: mockTrendData,
    trendLoading: false,
    activityData: mockActivityData,
    activityLoading: false,
    activeSignalsCount: 8,
    connectionStatus: 'warning',
  },
}

/**
 * Loading state for charts.
 */
export const Loading: Story = {
  args: {
    greeting: 'Good evening, Max!',
    subtitle: 'Loading dashboard data...',
    trendData: undefined,
    trendLoading: true,
    activityData: undefined,
    activityLoading: true,
    activeSignalsCount: 0,
    connectionStatus: 'healthy',
  },
}

/**
 * Zero signals state.
 */
export const NoSignals: Story = {
  args: {
    greeting: 'Good morning, Max!',
    subtitle: 'All caught up!',
    trendData: mockTrendData,
    trendLoading: false,
    activityData: mockActivityData,
    activityLoading: false,
    activeSignalsCount: 0,
    connectionStatus: 'healthy',
  },
}
