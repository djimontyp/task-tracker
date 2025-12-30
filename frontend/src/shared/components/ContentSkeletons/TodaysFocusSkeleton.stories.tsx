import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  FocusItemSkeleton,
  TodaysFocusSkeleton,
  ActionItemSkeleton,
  ActionListSkeleton,
  DailySummarySkeleton,
} from './TodaysFocusSkeleton';

const meta: Meta<typeof TodaysFocusSkeleton> = {
  title: 'Components/Skeletons/TodaysFocusSkeleton',
  component: TodaysFocusSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Content-aware skeleton for TodaysFocus component. Shows a card with title and list of focus items.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof TodaysFocusSkeleton>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "TodaysFocus card skeleton with header and 3 focus items (default).",
      },
    },
  },
};

export const WithCustomItemCount: Story = {
  args: {
    itemCount: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'TodaysFocus skeleton with 5 items for longer lists.',
      },
    },
  },
};

export const FocusItem: Story = {
  render: () => <FocusItemSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Single focus item skeleton with priority indicator and content.',
      },
    },
  },
};

export const ActionItem: Story = {
  render: () => <ActionItemSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Action item skeleton for task-like items with checkbox, title, meta, and badge.',
      },
    },
  },
};

export const ActionList: Story = {
  render: () => <ActionListSkeleton count={5} />,
  parameters: {
    docs: {
      description: {
        story: 'List of action item skeletons (5 items).',
      },
    },
  },
};

export const ActionListShort: Story = {
  render: () => <ActionListSkeleton count={3} />,
  parameters: {
    docs: {
      description: {
        story: 'Shorter action list with 3 items.',
      },
    },
  },
};

export const DailySummary: Story = {
  render: () => <DailySummarySkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Daily summary card skeleton with stats grid and focus items.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8 max-w-xl">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">TodaysFocus Card</h3>
        <TodaysFocusSkeleton itemCount={3} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Action List (3 items)</h3>
        <ActionListSkeleton count={3} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Daily Summary</h3>
        <DailySummarySkeleton />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All focus-related skeleton variants for comparison.',
      },
    },
  },
};
