import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  InsightCardSkeleton,
  InsightListSkeleton,
  TimelineInsightSkeleton,
  TimelineInsightsSkeleton,
} from './InsightCardSkeleton';

const meta: Meta<typeof InsightCardSkeleton> = {
  title: 'Components/Skeletons/InsightCardSkeleton',
  component: InsightCardSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Content-aware skeleton for RecentInsights component. Matches the timeline layout with icon dot, content card, and connecting line.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof InsightCardSkeleton>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Single insight card skeleton with icon and content placeholders.',
      },
    },
  },
};

export const List: Story = {
  render: () => <InsightListSkeleton count={3} />,
  parameters: {
    docs: {
      description: {
        story: 'List of insight card skeletons. Useful for loading states in insights feeds.',
      },
    },
  },
};

export const ListWithCustomCount: Story = {
  render: () => <InsightListSkeleton count={5} />,
  parameters: {
    docs: {
      description: {
        story: 'List with custom count (5 items).',
      },
    },
  },
};

export const TimelineItem: Story = {
  render: () => <TimelineInsightSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Single timeline insight skeleton with dot, connecting line, and content card.',
      },
    },
  },
};

export const TimelineWithCard: Story = {
  render: () => <TimelineInsightsSkeleton count={3} />,
  parameters: {
    docs: {
      description: {
        story:
          'Full timeline skeleton matching RecentInsights component with header and timeline items.',
      },
    },
  },
};

export const TimelineWithCustomCount: Story = {
  render: () => <TimelineInsightsSkeleton count={5} />,
  parameters: {
    docs: {
      description: {
        story: 'Timeline skeleton with 5 items for longer loading states.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Card Skeleton</h3>
        <InsightCardSkeleton />
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">List Skeleton (3 items)</h3>
        <InsightListSkeleton count={3} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Timeline Card Skeleton</h3>
        <TimelineInsightsSkeleton count={3} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All insight skeleton variants side by side for comparison.',
      },
    },
  },
};
