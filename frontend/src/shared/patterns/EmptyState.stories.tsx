import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Inbox,
  Search,
  Folder,
  FileText,
  Users,
  MessageSquare,
} from 'lucide-react';
import { EmptyState, IllustratedEmptyState, LoadingEmptyState } from './EmptyState';
import { Button } from '@/shared/ui/button';

const meta: Meta<typeof EmptyState> = {
  title: 'Design System/Patterns/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**EmptyState** - A consistent pattern for displaying empty states.

Used when:
- Lists have no items
- Search returns no results
- User hasn't created content yet
- Data failed to load

**Features:**
- Multiple variants: default, card, compact, inline
- Icon support (Heroicons)
- Optional action button
- Responsive design
- Dark mode compatible

**Usage:**
\`\`\`tsx
import { EmptyState } from '@/shared/patterns';
import { Inbox } from 'lucide-react';
import { Button } from '@/shared/ui/button';

<EmptyState
  icon={Inbox}
  title="No messages yet"
  description="Messages will appear here"
  action={<Button>Add message</Button>}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'card', 'compact', 'inline'],
      description: 'Visual variant',
    },
    iconSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Icon size',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

// ═══════════════════════════════════════════════════════════════
// DEFAULT STORIES
// ═══════════════════════════════════════════════════════════════

export const Default: Story = {
  args: {
    icon: Inbox,
    title: 'No messages yet',
    description: 'Messages will appear here once you receive them from connected sources.',
  },
};

export const WithAction: Story = {
  args: {
    icon: Folder,
    title: 'No projects found',
    description: 'Create your first project to start organizing your knowledge.',
    action: <Button>Create Project</Button>,
  },
};

export const NoDescription: Story = {
  args: {
    icon: FileText,
    title: 'No documents',
  },
};

// ═══════════════════════════════════════════════════════════════
// VARIANT STORIES
// ═══════════════════════════════════════════════════════════════

export const CardVariant: Story = {
  args: {
    variant: 'card',
    icon: Users,
    title: 'No team members',
    description: 'Invite team members to collaborate on this project.',
    action: <Button variant="outline">Invite Members</Button>,
  },
};

export const CompactVariant: Story = {
  args: {
    variant: 'compact',
    icon: Search,
    title: 'No results',
    description: 'Try adjusting your search terms.',
  },
};

export const InlineVariant: Story = {
  args: {
    variant: 'inline',
    icon: MessageSquare,
    title: 'No comments',
    description: 'Be the first to comment.',
    action: <Button size="sm" variant="outline">Add Comment</Button>,
  },
};

// ═══════════════════════════════════════════════════════════════
// SIZE STORIES
// ═══════════════════════════════════════════════════════════════

export const SmallIcon: Story = {
  args: {
    icon: Inbox,
    title: 'Empty inbox',
    iconSize: 'sm',
  },
};

export const LargeIcon: Story = {
  args: {
    icon: Inbox,
    title: 'Empty inbox',
    description: 'Your inbox is empty. New messages will appear here.',
    iconSize: 'lg',
  },
};

// ═══════════════════════════════════════════════════════════════
// USE CASE STORIES
// ═══════════════════════════════════════════════════════════════

export const SearchNoResults: Story = {
  args: {
    icon: Search,
    title: 'No results found',
    description: 'Try different keywords or remove some filters.',
    action: <Button variant="ghost">Clear filters</Button>,
  },
};

export const FirstTimeUser: Story = {
  args: {
    variant: 'card',
    icon: FileText,
    title: 'Welcome! Create your first topic',
    description: 'Topics help you organize knowledge from your messages. Get started by creating one.',
    action: (
      <div className="flex gap-2">
        <Button>Create Topic</Button>
        <Button variant="outline">Learn more</Button>
      </div>
    ),
  },
};

export const ErrorState: Story = {
  args: {
    icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-8 w-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    ),
    title: 'Failed to load data',
    description: 'Something went wrong. Please try again.',
    action: <Button variant="destructive">Retry</Button>,
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENT STORIES
// ═══════════════════════════════════════════════════════════════

export const IllustratedEmpty: StoryObj<typeof IllustratedEmptyState> = {
  render: () => (
    <IllustratedEmptyState
      illustration={
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="60" cy="60" r="50" className="fill-muted" />
          <path
            d="M40 70C40 70 50 85 60 85C70 85 80 70 80 70"
            className="stroke-muted-foreground"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="45" cy="50" r="5" className="fill-muted-foreground" />
          <circle cx="75" cy="50" r="5" className="fill-muted-foreground" />
        </svg>
      }
      title="Nothing here yet!"
      description="This page is empty. Start by adding some content."
      action={<Button>Get Started</Button>}
    />
  ),
};

export const Loading: StoryObj<typeof LoadingEmptyState> = {
  render: () => <LoadingEmptyState />,
};

// ═══════════════════════════════════════════════════════════════
// COMPOSITION STORIES
// ═══════════════════════════════════════════════════════════════

export const InList: Story = {
  render: () => (
    <div className="w-[400px] border rounded-lg">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Recent Messages</h3>
      </div>
      <EmptyState
        variant="compact"
        icon={MessageSquare}
        title="No messages"
        description="Messages from your sources will appear here."
      />
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="w-[500px]">
      <EmptyState
        variant="card"
        icon={Folder}
        title="No topics created"
        description="Topics help organize your knowledge. Create one to get started."
        action={
          <Button className="w-full sm:w-auto">
            Create your first topic
          </Button>
        }
      />
    </div>
  ),
};
