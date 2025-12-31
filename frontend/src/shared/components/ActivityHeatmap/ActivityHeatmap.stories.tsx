import type { Meta, StoryObj } from '@storybook/react-vite'
import { ActivityHeatmap, type ActivityDataPoint } from './ActivityHeatmap'

/**
 * ActivityHeatmap visualizes message activity patterns across days and hours.
 *
 * ## Portability
 * This is a **portable presenter** component - it receives all data via props
 * and works in Storybook without QueryClient or API mocking.
 *
 * ## Design System Rules
 * - Uses semantic heatmap colors from design tokens
 * - Responsive grid: larger cells on desktop, smaller on mobile
 * - Tooltips show exact counts and timestamps
 * - Source filters with checkboxes (Telegram active, Slack/Email disabled)
 * - Period toggle (week/month view)
 *
 * ## Usage
 * ```tsx
 * // In page/feature - fetch data externally
 * const { data, isLoading } = useQuery({ queryKey: ['activity'], queryFn: fetchActivity })
 * <ActivityHeatmap data={data} isLoading={isLoading} />
 * ```
 */

// Mock data generator for stories
const generateMockData = (days: number = 7): ActivityDataPoint[] => {
  const data: ActivityDataPoint[] = []
  const now = new Date()

  for (let d = 0; d < days; d++) {
    const date = new Date(now)
    date.setDate(date.getDate() - d)

    // Generate 5-15 messages per day
    const messagesPerDay = Math.floor(Math.random() * 10) + 5
    for (let m = 0; m < messagesPerDay; m++) {
      const hour = Math.floor(Math.random() * 24)
      date.setHours(hour, Math.floor(Math.random() * 60))
      data.push({
        timestamp: date.toISOString(),
        source: 'telegram',
        count: Math.floor(Math.random() * 5) + 1,
      })
    }
  }

  return data
}

// Pre-generated mock data
const weekData = generateMockData(7)
const monthData = generateMockData(30)
const highActivityData = generateMockData(7).concat(generateMockData(7)).concat(generateMockData(7))
const emptyData: ActivityDataPoint[] = []

const meta: Meta<typeof ActivityHeatmap> = {
  title: 'Patterns/ActivityHeatmap',
  component: ActivityHeatmap,
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'Activity data points array',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state - shows skeleton',
    },
    title: {
      control: 'text',
      description: 'Heatmap title (editable on click)',
    },
    period: {
      control: 'select',
      options: ['week', 'month'],
      description: 'Time period to display',
    },
    enabledSources: {
      control: 'object',
      description: 'Array of enabled sources',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A **portable** heatmap component showing message activity patterns. Receives data via props - no internal data fetching.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof ActivityHeatmap>

/**
 * Default story with mock week data.
 * Demonstrates the portable pattern - data passed via props.
 */
export const Default: Story = {
  args: {
    data: weekData,
    title: 'Message Activity Heatmap',
    period: 'week',
    enabledSources: ['telegram'],
  },
}

/**
 * Loading state - shows skeleton while data is being fetched.
 */
export const Loading: Story = {
  args: {
    data: [],
    isLoading: true,
    title: 'Loading Activity...',
    period: 'week',
    enabledSources: ['telegram'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Skeleton loading state while data is being fetched.',
      },
    },
  },
}

/**
 * Empty state - no activity data.
 */
export const Empty: Story = {
  args: {
    data: emptyData,
    isLoading: false,
    title: 'No Activity Yet',
    period: 'week',
    enabledSources: ['telegram'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty heatmap when no activity data is available.',
      },
    },
  },
}

/**
 * Month view with 30 days of data.
 */
export const MonthView: Story = {
  args: {
    data: monthData,
    title: 'Monthly Activity Overview',
    period: 'month',
    enabledSources: ['telegram'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Month view shows activity for all days in the selected month.',
      },
    },
  },
}

/**
 * Editable title with callback.
 */
export const CustomTitle: Story = {
  args: {
    data: weekData,
    title: 'Team Communication Patterns',
    period: 'week',
    enabledSources: ['telegram'],
    onTitleChange: (newTitle: string) => console.log('Title changed to:', newTitle),
  },
  parameters: {
    docs: {
      description: {
        story: 'Click on title to edit. OnTitleChange callback triggered on blur or Enter.',
      },
    },
  },
}

/**
 * High activity week with lots of messages.
 */
export const HighActivity: Story = {
  args: {
    data: highActivityData,
    title: 'High Activity Week',
    period: 'week',
    enabledSources: ['telegram'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Heatmap with high message volume across all hours.',
      },
    },
  },
}

/**
 * Mobile responsive layout.
 */
export const MobileLayout: Story = {
  args: {
    data: weekData,
    title: 'Mobile Heatmap',
    period: 'week',
    enabledSources: ['telegram'],
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'On mobile, cells are smaller and horizontal scroll is enabled.',
      },
    },
  },
}

/**
 * Dark mode theme.
 */
export const DarkMode: Story = {
  args: {
    data: weekData,
    title: 'Dark Mode Heatmap',
    period: 'week',
    enabledSources: ['telegram'],
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Heatmap in dark mode with appropriate color adjustments.',
      },
    },
  },
}

/**
 * Interactive demo with period switching.
 */
export const InteractiveDemo: Story = {
  render: function InteractiveDemoStory() {
    const [period, setPeriod] = React.useState<'week' | 'month'>('week')
    const [title, setTitle] = React.useState('Interactive Heatmap Demo')
    const data = period === 'week' ? weekData : monthData

    return (
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded ${period === 'week' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          >
            Week View
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded ${period === 'month' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          >
            Month View
          </button>
        </div>
        <ActivityHeatmap
          data={data}
          title={title}
          period={period}
          enabledSources={['telegram']}
          onTitleChange={setTitle}
        />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo with external controls for period switching.',
      },
    },
  },
}

import React from 'react'
