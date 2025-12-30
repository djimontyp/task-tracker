import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  MessageCardSkeleton,
  MessageFeedSkeleton,
  MessageCompactSkeleton,
  MessageCompactListSkeleton,
} from './MessageCardSkeleton';

const meta: Meta<typeof MessageCardSkeleton> = {
  title: 'Components/Skeletons/MessageCardSkeleton',
  component: MessageCardSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Content-aware skeleton for MessagesPage feed view. Matches MessageCard layout with avatar, author, content, and badges.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof MessageCardSkeleton>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Single message card skeleton with header, content, and footer placeholders.',
      },
    },
  },
};

export const Feed: Story = {
  render: () => <MessageFeedSkeleton count={5} />,
  parameters: {
    docs: {
      description: {
        story: 'Message feed skeleton with 5 cards. Default for loading message lists.',
      },
    },
  },
};

export const FeedWithCustomCount: Story = {
  render: () => <MessageFeedSkeleton count={3} />,
  parameters: {
    docs: {
      description: {
        story: 'Message feed with 3 cards for shorter loading states.',
      },
    },
  },
};

export const Compact: Story = {
  render: () => <MessageCompactSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Compact message skeleton for smaller displays with inline layout.',
      },
    },
  },
};

export const CompactList: Story = {
  render: () => <MessageCompactListSkeleton count={10} />,
  parameters: {
    docs: {
      description: {
        story: 'List of compact message skeletons. Useful for sidebar or narrow containers.',
      },
    },
  },
};

export const CompactListShort: Story = {
  render: () => <MessageCompactListSkeleton count={5} />,
  parameters: {
    docs: {
      description: {
        story: 'Shorter compact list with 5 items.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Card Skeleton</h3>
        <MessageCardSkeleton />
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Feed (3 cards)</h3>
        <MessageFeedSkeleton count={3} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Compact (5 items)</h3>
        <MessageCompactListSkeleton count={5} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All message skeleton variants side by side for comparison.',
      },
    },
  },
};
