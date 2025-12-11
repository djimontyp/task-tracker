import type { Meta, StoryObj } from '@storybook/react-vite'
import { BarChart3, Users, FileText, AlertTriangle } from 'lucide-react'
import MetricCard from './MetricCard'

/**
 * MetricCard displays key metrics with optional trends, status badges, and click handlers.
 *
 * ## Design System Rules
 * - Status colors use semantic tokens (semantic-success, semantic-warning, semantic-error)
 * - Responsive text sizing (2xl on mobile → 5xl on 3xl screens)
 * - Touch targets 44px minimum (when clickable)
 * - Trend indicators with semantic colors (green=up, red=down)
 */
const meta: Meta<typeof MetricCard> = {
  title: 'Patterns/MetricCard',
  component: MetricCard,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Metric title displayed above the value',
    },
    value: {
      control: 'text',
      description: 'Main metric value (string or number)',
    },
    subtitle: {
      control: 'text',
      description: 'Additional context below the value',
    },
    status: {
      control: 'select',
      options: ['critical', 'warning', 'optimal'],
      description: 'Status badge with color coding',
    },
    loading: {
      control: 'boolean',
      description: 'Shows skeleton loader',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler (makes card interactive)',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'A metric card component for displaying KPIs with trends, status badges, and interactive states.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof MetricCard>

// Basic variants
export const Default: Story = {
  args: {
    title: 'Total Messages',
    value: '1,245',
    subtitle: 'Last 30 days',
  },
}

export const WithIcon: Story = {
  args: {
    title: 'Active Users',
    value: 342,
    subtitle: 'Currently online',
    icon: Users,
    iconColor: 'text-primary',
  },
}

export const WithTrendUp: Story = {
  args: {
    title: 'Revenue',
    value: '$45,231',
    subtitle: 'Monthly recurring',
    icon: BarChart3,
    iconColor: 'text-semantic-success',
    trend: {
      value: 12.5,
      direction: 'up',
    },
  },
}

export const WithTrendDown: Story = {
  args: {
    title: 'Error Rate',
    value: '2.3%',
    subtitle: 'Last 24 hours',
    icon: AlertTriangle,
    iconColor: 'text-semantic-error',
    trend: {
      value: 8,
      direction: 'down',
    },
  },
}

export const WithTrendNeutral: Story = {
  args: {
    title: 'Processing Time',
    value: '1.2s',
    subtitle: 'Average response',
    trend: {
      value: 0,
      direction: 'neutral',
    },
  },
}

// Status variants
export const StatusOptimal: Story = {
  args: {
    title: 'System Health',
    value: '99.9%',
    subtitle: 'All services operational',
    status: 'optimal',
    icon: BarChart3,
    iconColor: 'text-semantic-success',
  },
}

export const StatusWarning: Story = {
  args: {
    title: 'API Latency',
    value: '450ms',
    subtitle: 'Above threshold',
    status: 'warning',
    icon: AlertTriangle,
    iconColor: 'text-semantic-warning',
    trend: {
      value: 15,
      direction: 'up',
    },
  },
}

export const StatusCritical: Story = {
  args: {
    title: 'Failed Jobs',
    value: 23,
    subtitle: 'Requires attention',
    status: 'critical',
    icon: AlertTriangle,
    iconColor: 'text-semantic-error',
    trend: {
      value: 300,
      direction: 'up',
    },
  },
}

// States
export const Loading: Story = {
  args: {
    title: 'Total Messages',
    value: '1,245',
    loading: true,
  },
}

export const EmptyState: Story = {
  args: {
    title: 'New Signups',
    value: 0,
    emptyMessage: 'No signups today',
  },
}

export const Clickable: Story = {
  args: {
    title: 'Active Tasks',
    value: 127,
    subtitle: 'View all tasks',
    icon: FileText,
    iconColor: 'text-primary',
    onClick: () => console.log('Card clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive card with ripple effect and focus ring for accessibility.',
      },
    },
  },
}

// Glow variants
export const WithHoverGlow: Story = {
  args: {
    title: 'Total Revenue',
    value: '$45,231',
    subtitle: 'Monthly recurring',
    icon: BarChart3,
    iconColor: 'text-primary',
    trend: {
      value: 12.5,
      direction: 'up',
    },
  },
  render: (args) => (
    <div className="p-8 bg-background">
      <p className="text-sm text-muted-foreground mb-4">Hover to see glow effect</p>
      <div className="max-w-xs">
        <div className="transition-all duration-300 hover:shadow-glow-hover">
          <MetricCard {...args} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'MetricCard with subtle glow effect on hover. Used for important/featured metrics that need visual emphasis.',
      },
    },
  },
}

export const FeaturedWithGlow: Story = {
  args: {
    title: 'Critical Alerts',
    value: 3,
    subtitle: 'Requires immediate attention',
    icon: AlertTriangle,
    iconColor: 'text-semantic-error',
    status: 'critical',
  },
  render: (args) => (
    <div className="p-8 bg-background">
      <p className="text-sm text-muted-foreground mb-4">Always-on glow for featured metrics</p>
      <div className="max-w-xs">
        <div className="shadow-glow">
          <MetricCard {...args} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Featured MetricCard with persistent glow effect. Draws attention to critical metrics.',
      },
    },
  },
}

// Dashboard showcase
export const DashboardExample: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Messages"
        value="1,245"
        subtitle="Last 30 days"
        icon={FileText}
        iconColor="text-primary"
        trend={{ value: 12, direction: 'up' }}
      />
      <MetricCard
        title="Active Users"
        value={342}
        subtitle="Currently online"
        icon={Users}
        iconColor="text-semantic-success"
        status="optimal"
      />
      <MetricCard
        title="Error Rate"
        value="2.3%"
        subtitle="Last 24 hours"
        icon={AlertTriangle}
        iconColor="text-semantic-warning"
        status="warning"
        trend={{ value: 5, direction: 'down' }}
      />
      <MetricCard
        title="Failed Jobs"
        value={8}
        subtitle="Requires attention"
        icon={AlertTriangle}
        iconColor="text-semantic-error"
        status="critical"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example dashboard layout with 4 metric cards showing different states.',
      },
    },
  },
}
