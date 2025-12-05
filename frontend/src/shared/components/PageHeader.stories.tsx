import type { Meta, StoryObj } from '@storybook/react-vite'
import { Plus, Download } from 'lucide-react'
import { PageHeader } from './PageHeader'
import { Button } from '@/shared/ui/button'

/**
 * PageHeader provides a consistent header layout for pages with title, description, and action buttons.
 *
 * ## Design System Rules
 * - Responsive layout: stacked on mobile, horizontal on desktop
 * - Description truncates with tooltip on overflow
 * - Actions area full-width on mobile, auto-width on desktop
 */
const meta: Meta<typeof PageHeader> = {
  title: 'Shared/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Page title (required)',
    },
    description: {
      control: 'text',
      description: 'Optional description with tooltip on overflow',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'A page header component with title, description, and action area.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof PageHeader>

// Basic variants
export const Default: Story = {
  args: {
    title: 'Messages',
  },
}

export const WithDescription: Story = {
  args: {
    title: 'Messages',
    description: 'View and manage all incoming messages from communication channels',
  },
}

export const WithSingleAction: Story = {
  args: {
    title: 'Topics',
    description: 'Organize messages into topics for better knowledge management',
    actions: (
      <Button>
        <Plus className="h-4 w-4" />
        Create Topic
      </Button>
    ),
  },
}

export const WithMultipleActions: Story = {
  args: {
    title: 'Analysis Runs',
    description: 'Track AI analysis runs and their results',
    actions: (
      <div className="flex gap-2">
        <Button variant="outline">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button>
          <Plus className="h-4 w-4" />
          New Run
        </Button>
      </div>
    ),
  },
}

export const LongDescription: Story = {
  args: {
    title: 'Knowledge Extraction',
    description:
      'This is a very long description that demonstrates text truncation and tooltip functionality. The description will be truncated on the page but fully visible in the tooltip when you hover over it. This helps maintain a clean layout while preserving information accessibility.',
  },
}

// Mobile responsive
export const MobileLayout: Story = {
  args: {
    title: 'Dashboard',
    description: 'Overview of your workspace activity and metrics',
    actions: (
      <Button className="w-full md:w-auto">
        <Plus className="h-4 w-4" />
        Create Item
      </Button>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'On mobile, actions take full width and stack below the title.',
      },
    },
  },
}

// Real-world examples
export const MessagesPage: Story = {
  args: {
    title: 'Messages',
    description: 'View and filter messages from Telegram, Slack, and other sources',
    actions: (
      <Button>
        <Plus className="h-4 w-4" />
        Import Messages
      </Button>
    ),
  },
}

export const SettingsPage: Story = {
  args: {
    title: 'Settings',
    description: 'Configure your workspace preferences and integrations',
  },
}

export const AnalyticsPage: Story = {
  args: {
    title: 'Analytics',
    description: 'Insights and trends from your message data',
    actions: (
      <div className="flex gap-2">
        <Button variant="outline">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
        <Button variant="outline">Custom Range</Button>
      </div>
    ),
  },
}
