import type { Meta, StoryObj } from '@storybook/react-vite';
import { NotificationBadge } from './notification-badge';
import { Bell } from 'lucide-react';

const meta: Meta<typeof NotificationBadge> = {
  title: 'UI/NotificationBadge',
  component: NotificationBadge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Badge for displaying notification counts with adaptive sizing. Auto-caps at 999+ for large numbers and hides when count is zero.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NotificationBadge>;

export const Default: Story = {
  args: {
    count: 5,
  },
};

export const SingleDigit: Story = {
  args: {
    count: 3,
  },
};

export const DoubleDigit: Story = {
  args: {
    count: 42,
  },
};

export const HighCount: Story = {
  args: {
    count: 99,
  },
};

export const LargeCount: Story = {
  args: {
    count: 150,
  },
  parameters: {
    docs: {
      description: {
        story: 'Numbers over 99 are displayed with smaller text for better fit.',
      },
    },
  },
};

export const CappedAt999: Story = {
  args: {
    count: 1234,
  },
  parameters: {
    docs: {
      description: {
        story: 'Counts above 999 are displayed as "999+".',
      },
    },
  },
};

export const Zero: Story = {
  args: {
    count: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge is hidden when count is zero.',
      },
    },
  },
};

export const WithTooltip: Story = {
  args: {
    count: 25,
    tooltip: 'You have 25 unread notifications',
  },
};

export const WithIcon: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Bell className="h-6 w-6 text-foreground" />
      <NotificationBadge {...args} />
    </div>
  ),
  args: {
    count: 12,
  },
  parameters: {
    docs: {
      description: {
        story: 'Common pattern: badge next to an icon (e.g., bell icon for notifications).',
      },
    },
  },
};

export const InButton: Story = {
  render: (args) => (
    <button className="relative inline-flex items-center justify-center p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
      <Bell className="h-5 w-5" />
      <span className="absolute -top-1 -right-1">
        <NotificationBadge {...args} className="min-w-5 h-5 text-[10px]" />
      </span>
    </button>
  ),
  args: {
    count: 7,
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge positioned absolutely on top of a button for notification indicators.',
      },
    },
  },
};

export const MultipleStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="w-24 text-sm">No notifications:</span>
        <NotificationBadge count={0} />
        <span className="text-xs text-muted-foreground">(hidden)</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-24 text-sm">Low count:</span>
        <NotificationBadge count={5} />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-24 text-sm">Medium count:</span>
        <NotificationBadge count={42} />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-24 text-sm">High count:</span>
        <NotificationBadge count={156} />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-24 text-sm">Max count:</span>
        <NotificationBadge count={9999} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all notification badge states from zero to capped max.',
      },
    },
  },
};
