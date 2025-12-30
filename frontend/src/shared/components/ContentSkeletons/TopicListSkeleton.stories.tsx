import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  TopicItemSkeleton,
  TopicListSkeleton,
  TopTopicsCardSkeleton,
  TopicBadgesSkeleton,
} from './TopicListSkeleton';

const meta: Meta<typeof TopicListSkeleton> = {
  title: 'Components/Skeletons/TopicListSkeleton',
  component: TopicListSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Content-aware skeleton for TopTopics component. Matches the list layout with icon, topic name, and stats.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof TopicListSkeleton>;

export const Default: Story = {
  args: {
    count: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'List of 5 topic item skeletons (default).',
      },
    },
  },
};

export const Item: Story = {
  render: () => <TopicItemSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Single topic item skeleton matching TopicItem layout.',
      },
    },
  },
};

export const ShortList: Story = {
  args: {
    count: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shorter list with 3 topic items.',
      },
    },
  },
};

export const LongList: Story = {
  args: {
    count: 10,
  },
  parameters: {
    docs: {
      description: {
        story: 'Longer list with 10 topic items for paginated views.',
      },
    },
  },
};

export const CardWithHeader: Story = {
  render: () => <TopTopicsCardSkeleton count={5} />,
  parameters: {
    docs: {
      description: {
        story: 'TopTopics card skeleton with header and topic list.',
      },
    },
  },
};

export const CardShort: Story = {
  render: () => <TopTopicsCardSkeleton count={3} />,
  parameters: {
    docs: {
      description: {
        story: 'TopTopics card with 3 items for compact widgets.',
      },
    },
  },
};

export const Badges: Story = {
  render: () => <TopicBadgesSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Horizontal topic badges skeleton for compact displays.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8 max-w-md">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Single Item</h3>
        <TopicItemSkeleton />
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">List (3 items)</h3>
        <TopicListSkeleton count={3} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Card with Header</h3>
        <TopTopicsCardSkeleton count={3} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Badges</h3>
        <TopicBadgesSkeleton />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All topic skeleton variants for comparison.',
      },
    },
  },
};
