import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  MessageSquare,
  Star,
  Bell,
} from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  ListItemWithAvatar,
  CompactListItem,
  ListContainer,
} from './ListItemWithAvatar';

/**
 * ListItemWithAvatar pattern for user/entity lists.
 *
 * Use this pattern for:
 * - Message lists
 * - User lists
 * - Activity feeds
 * - Recent items
 */
const meta: Meta<typeof ListItemWithAvatar> = {
  title: 'Patterns/ListItemWithAvatar',
  component: ListItemWithAvatar,
  tags: ['autodocs'],
  argTypes: {
    avatarSize: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    divider: { control: 'boolean' },
    highlighted: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ListItemWithAvatar>;

/**
 * Basic list item with avatar
 */
export const Basic: Story = {
  args: {
    avatar: {
      src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      fallback: 'JD',
    },
    title: 'John Doe',
    subtitle: 'john.doe@example.com',
  },
};

/**
 * Interactive list item (clickable)
 */
export const Interactive: Story = {
  args: {
    avatar: {
      src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
      fallback: 'JS',
    },
    title: 'Jane Smith',
    subtitle: 'Product Manager',
    onClick: () => alert('Item clicked!'),
  },
};

/**
 * With metadata badge
 */
export const WithMeta: Story = {
  args: {
    avatar: {
      src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
      fallback: 'AD',
    },
    title: 'Admin User',
    subtitle: 'admin@company.com',
    meta: <Badge variant="secondary">Admin</Badge>,
  },
};

/**
 * With trailing action
 */
export const WithTrailing: Story = {
  args: {
    avatar: {
      src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User1',
      fallback: 'U1',
    },
    title: 'Team Member',
    subtitle: 'Last active 2 hours ago',
    trailing: (
      <Button variant="ghost" size="sm">
        View
      </Button>
    ),
  },
};

/**
 * With timestamp trailing
 */
export const WithTimestamp: Story = {
  args: {
    avatar: {
      fallback: 'PA',
    },
    title: 'Pulse Assistant',
    subtitle: 'New message in #general',
    meta: <Badge variant="outline">Bot</Badge>,
    trailing: <span className="text-xs text-muted-foreground">2m ago</span>,
  },
};

/**
 * Highlighted state (e.g., unread)
 */
export const Highlighted: Story = {
  args: {
    avatar: {
      src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=New',
      fallback: 'NM',
    },
    title: 'New Message',
    subtitle: 'You have an unread notification',
    highlighted: true,
    meta: <Badge>New</Badge>,
  },
};

/**
 * Different avatar sizes
 */
export const AvatarSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <ListItemWithAvatar
        avatar={{ fallback: 'SM' }}
        avatarSize="sm"
        title="Small Avatar"
        subtitle="Size: sm (32px)"
      />
      <ListItemWithAvatar
        avatar={{ fallback: 'MD' }}
        avatarSize="md"
        title="Medium Avatar (default)"
        subtitle="Size: md (40px)"
      />
      <ListItemWithAvatar
        avatar={{ fallback: 'LG' }}
        avatarSize="lg"
        title="Large Avatar"
        subtitle="Size: lg (48px)"
      />
      <ListItemWithAvatar
        avatar={{ fallback: 'XL' }}
        avatarSize="xl"
        title="Extra Large Avatar"
        subtitle="Size: xl (64px)"
      />
    </div>
  ),
};

/**
 * List with dividers
 */
export const WithDividers: Story = {
  render: () => (
    <ListContainer divided>
      <ListItemWithAvatar
        avatar={{ src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User1', fallback: 'U1' }}
        title="User One"
        subtitle="First list item"
      />
      <ListItemWithAvatar
        avatar={{ src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User2', fallback: 'U2' }}
        title="User Two"
        subtitle="Second list item"
      />
      <ListItemWithAvatar
        avatar={{ src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User3', fallback: 'U3' }}
        title="User Three"
        subtitle="Third list item"
      />
    </ListContainer>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use ListContainer with `divided` prop for automatic dividers.',
      },
    },
  },
};

/**
 * CompactListItem variant
 */
export const Compact: Story = {
  render: () => (
    <div className="space-y-1">
      <CompactListItem
        icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
        title="Recent message"
        subtitle="2m ago"
        onClick={() => alert('Clicked!')}
      />
      <CompactListItem
        icon={<Star className="h-4 w-4 text-muted-foreground" />}
        title="Starred item"
        subtitle="Yesterday"
        onClick={() => alert('Clicked!')}
      />
      <CompactListItem
        icon={<Bell className="h-4 w-4 text-muted-foreground" />}
        title="Notification"
        subtitle="1h ago"
        onClick={() => alert('Clicked!')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'CompactListItem for smaller, icon-based lists.',
      },
    },
  },
};

/**
 * Message feed example
 */
export const MessageFeed: Story = {
  render: () => (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-4">Recent Messages</h3>
      <ListContainer divided>
        <ListItemWithAvatar
          avatar={{ src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', fallback: 'A' }}
          title="Alice"
          subtitle="Hey, can you review the latest PR?"
          trailing={<span className="text-xs text-muted-foreground">5m</span>}
          onClick={() => {}}
        />
        <ListItemWithAvatar
          avatar={{ src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', fallback: 'B' }}
          title="Bob"
          subtitle="The deployment is complete 🎉"
          trailing={<span className="text-xs text-muted-foreground">15m</span>}
          highlighted
          onClick={() => {}}
        />
        <ListItemWithAvatar
          avatar={{ fallback: 'PA' }}
          title="Pulse Assistant"
          subtitle="Build #234 passed successfully"
          meta={<Badge variant="outline" className="text-xs">Bot</Badge>}
          trailing={<span className="text-xs text-muted-foreground">1h</span>}
          onClick={() => {}}
        />
      </ListContainer>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete message feed example with various item states.',
      },
    },
  },
};
