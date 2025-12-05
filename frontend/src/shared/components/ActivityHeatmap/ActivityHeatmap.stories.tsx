import type { Meta, StoryObj } from '@storybook/react-vite'
import ActivityHeatmap from './ActivityHeatmap'

/**
 * ActivityHeatmap visualizes message activity patterns across days and hours.
 *
 * ## Design System Rules
 * - Uses semantic heatmap colors from design tokens
 * - Responsive grid: larger cells on desktop, smaller on mobile
 * - Tooltips show exact counts and timestamps
 * - Source filters with checkboxes (Telegram active, Slack/Email disabled)
 * - Period toggle (week/month view)
 */
const meta: Meta<typeof ActivityHeatmap> = {
  title: 'Shared/ActivityHeatmap',
  component: ActivityHeatmap,
  tags: ['autodocs'],
  argTypes: {
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
          'A heatmap component showing message activity patterns with configurable time periods and sources.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof ActivityHeatmap>

export const Default: Story = {
  args: {
    title: 'Message Activity Heatmap',
    period: 'week',
    enabledSources: ['telegram'],
  },
}

export const MonthView: Story = {
  args: {
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

export const CustomTitle: Story = {
  args: {
    title: 'Team Communication Patterns',
    period: 'week',
    enabledSources: ['telegram'],
    onTitleChange: (newTitle) => console.log('Title changed to:', newTitle),
  },
  parameters: {
    docs: {
      description: {
        story: 'Click on title to edit. OnTitleChange callback triggered on blur or Enter.',
      },
    },
  },
}

export const MultipleSourcesEnabled: Story = {
  args: {
    title: 'All Sources Activity',
    period: 'week',
    enabledSources: ['telegram', 'slack', 'email'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple sources enabled (Slack and Email are currently disabled in UI).',
      },
    },
  },
}

// Real-world examples
export const LowActivity: Story = {
  render: () => {
    return <ActivityHeatmap title="Low Activity Week" period="week" enabledSources={['telegram']} />
  },
  parameters: {
    docs: {
      description: {
        story: 'Heatmap with sparse activity (mostly empty cells).',
      },
    },
  },
}

export const HighActivity: Story = {
  render: () => {
    return (
      <ActivityHeatmap title="High Activity Week" period="week" enabledSources={['telegram']} />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Heatmap with high message volume across all hours.',
      },
    },
  },
}

export const WorkHoursPattern: Story = {
  render: () => {
    return (
      <ActivityHeatmap
        title="Work Hours Activity (9-5)"
        period="week"
        enabledSources={['telegram']}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Typical work hours pattern: high activity 9 AM - 5 PM, low activity nights/weekends.',
      },
    },
  },
}

// Mobile responsive
export const MobileLayout: Story = {
  args: {
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

// Dark mode
export const DarkMode: Story = {
  args: {
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

// Interactive demo
export const InteractiveDemo: Story = {
  render: () => {
    const [period, setPeriod] = React.useState<'week' | 'month'>('week')
    const [title, setTitle] = React.useState('Interactive Heatmap Demo')

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
