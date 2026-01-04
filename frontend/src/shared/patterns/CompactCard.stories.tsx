/**
 * CompactCard Storybook Stories
 *
 * Mobile-first card variant with compact layout.
 * All stories demonstrate the component at mobile viewport.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { CompactCard } from './CompactCard';
import { Badge } from '@/shared/ui/badge';
import { Pencil, Copy, Settings, Trash2, TestTube2, Lightbulb, X, MoreHorizontal } from 'lucide-react';
import { TooltipProvider } from '@/shared/ui/tooltip';

// ===================================================================
// META
// ===================================================================

const meta: Meta<typeof CompactCard> = {
  title: 'Design System/Patterns/CompactCard',
  component: CompactCard,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="max-w-[375px] p-4 bg-background">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        component: `
Mobile-first card variant optimized for small screens (<=640px).

**Key features:**
- Single-line truncated title with tooltip on overflow
- Compact padding (p-3 vs default p-4)
- Primary action always visible
- Secondary actions collapse to overflow menu when 3+
- Touch targets >= 44px (WCAG compliant)
- Hidden on desktop (sm:hidden)

**Use cases:**
- AgentCard mobile variant
- ProjectCard mobile variant
- MessageCard mobile variant
- TopicCard mobile variant
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CompactCard>;

// ===================================================================
// STORIES
// ===================================================================

/**
 * Default card with title and content only.
 */
export const Default: Story = {
  args: {
    title: 'Agent Configuration',
    content: (
      <p className="text-sm text-muted-foreground line-clamp-2">
        A simple agent configuration with description text that might span multiple lines.
      </p>
    ),
  },
};

/**
 * Card with status badge next to title.
 */
export const WithBadge: Story = {
  args: {
    title: 'Knowledge Extractor',
    badge: (
      <Badge variant="default" className="bg-semantic-success text-white">
        Active
      </Badge>
    ),
    content: (
      <p className="text-sm text-muted-foreground line-clamp-2">
        Extracts knowledge atoms from incoming messages.
      </p>
    ),
  },
};

/**
 * Card with inactive status badge.
 */
export const WithInactiveBadge: Story = {
  args: {
    title: 'Legacy Classifier',
    badge: (
      <Badge variant="secondary">
        Inactive
      </Badge>
    ),
    content: (
      <p className="text-sm text-muted-foreground line-clamp-2">
        Deprecated classification agent.
      </p>
    ),
  },
};

/**
 * Card with single primary action.
 */
export const WithOneAction: Story = {
  args: {
    title: 'Quick Actions Demo',
    badge: <Badge variant="outline">Demo</Badge>,
    primaryAction: {
      label: 'Edit',
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => console.log('Edit clicked'),
    },
    content: (
      <p className="text-sm text-muted-foreground">
        Card with one action button visible.
      </p>
    ),
  },
};

/**
 * Card with two secondary actions (no overflow).
 */
export const WithTwoActions: Story = {
  args: {
    title: 'Two Actions Example',
    badge: <Badge variant="outline">2 Actions</Badge>,
    primaryAction: {
      label: 'Edit',
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => console.log('Edit clicked'),
    },
    secondaryActions: [
      {
        label: 'Copy',
        icon: <Copy className="h-4 w-4" />,
        onClick: () => console.log('Copy clicked'),
      },
    ],
    content: (
      <p className="text-sm text-muted-foreground">
        Two actions shown inline (no overflow menu).
      </p>
    ),
  },
};

/**
 * Card with 3+ secondary actions showing overflow menu.
 * AgentCard pattern: Edit, Copy, Settings, Test, Delete
 */
export const WithOverflowMenu: Story = {
  args: {
    title: 'Message Analyzer Agent',
    badge: (
      <Badge variant="default" className="bg-semantic-success text-white">
        Active
      </Badge>
    ),
    primaryAction: {
      label: 'Edit',
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => console.log('Edit clicked'),
    },
    secondaryActions: [
      {
        label: 'Copy',
        icon: <Copy className="h-4 w-4" />,
        onClick: () => console.log('Copy clicked'),
      },
      {
        label: 'Manage Tasks',
        icon: <Settings className="h-4 w-4" />,
        onClick: () => console.log('Manage Tasks clicked'),
      },
      {
        label: 'Test',
        icon: <TestTube2 className="h-4 w-4" />,
        onClick: () => console.log('Test clicked'),
      },
      {
        label: 'Delete',
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => console.log('Delete clicked'),
        variant: 'destructive',
      },
    ],
    content: (
      <p className="text-sm text-muted-foreground line-clamp-2">
        Analyzes messages for sentiment and key topics using GPT-4.
      </p>
    ),
  },
};

/**
 * Long title that gets truncated with tooltip on hover.
 */
export const LongTitle: Story = {
  args: {
    title: 'Very Long Agent Configuration Name That Will Definitely Be Truncated On Mobile Screens',
    badge: <Badge variant="outline">Truncated</Badge>,
    primaryAction: {
      label: 'Edit',
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => console.log('Edit clicked'),
    },
    content: (
      <p className="text-sm text-muted-foreground line-clamp-2">
        Hover over the title to see the full text in a tooltip.
      </p>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Long titles are truncated with ellipsis. Hover to see full title in tooltip.',
      },
    },
  },
};

/**
 * Loading state with skeleton.
 */
export const Loading: Story = {
  args: {
    title: 'Loading...',
    isLoading: true,
  },
};

/**
 * Error state with retry button.
 */
export const ErrorState: Story = {
  args: {
    title: 'Failed Card',
    isError: true,
    error: new globalThis.Error('Network request failed'),
    onRetry: () => console.log('Retry clicked'),
  },
};

/**
 * Empty state with custom message.
 */
export const Empty: Story = {
  args: {
    title: 'Empty Card',
    isEmpty: true,
    emptyMessage: 'No agents configured yet',
  },
};

/**
 * Clickable navigation card (like TopicCard).
 */
export const Clickable: Story = {
  args: {
    title: 'Frontend Development',
    badge: (
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center"
        style={{ backgroundColor: '#3b82f6' }}
      >
        <span className="text-lg">React</span>
      </div>
    ),
    content: (
      <p className="text-sm text-muted-foreground line-clamp-2">
        All frontend-related knowledge atoms and discussions.
      </p>
    ),
    onClick: () => console.log('Card clicked - navigate to topic'),
    'aria-label': 'Navigate to Frontend Development topic',
  },
  parameters: {
    docs: {
      description: {
        story: 'Clickable card for navigation. Has hover state and keyboard support.',
      },
    },
  },
};

/**
 * Message card pattern with Create Atom and Dismiss actions.
 */
export const MessagePattern: Story = {
  args: {
    title: 'John Doe',
    badge: (
      <Badge variant="default" className="bg-semantic-warning text-white">
        0.75
      </Badge>
    ),
    primaryAction: {
      label: 'Create Atom',
      icon: <Lightbulb className="h-4 w-4" />,
      onClick: () => console.log('Create Atom clicked'),
    },
    secondaryActions: [
      {
        label: 'Dismiss',
        icon: <X className="h-4 w-4" />,
        onClick: () => console.log('Dismiss clicked'),
      },
    ],
    content: (
      <p className="text-sm text-muted-foreground line-clamp-2">
        Hey team, I found a critical bug in the authentication flow. We need to fix it before the release.
      </p>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Message card pattern with importance score badge and quick actions.',
      },
    },
  },
};

/**
 * Project card pattern with Edit and Delete actions.
 */
export const ProjectPattern: Story = {
  args: {
    title: 'Pulse Radar',
    badge: (
      <Badge variant="outline" className="bg-semantic-success text-white border-semantic-success">
        Active
      </Badge>
    ),
    primaryAction: {
      label: 'Edit',
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => console.log('Edit clicked'),
    },
    secondaryActions: [
      {
        label: 'Delete',
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => console.log('Delete clicked'),
        variant: 'destructive',
      },
    ],
    content: (
      <p className="text-sm text-muted-foreground line-clamp-2">
        AI-powered knowledge extraction from communication channels.
      </p>
    ),
  },
};

/**
 * All states comparison for visual testing.
 */
export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <CompactCard
        title="Default State"
        badge={<Badge variant="outline">Default</Badge>}
        content={<p className="text-sm text-muted-foreground">Normal card state.</p>}
      />
      <CompactCard
        title="With Actions"
        badge={<Badge variant="default">Active</Badge>}
        primaryAction={{
          label: 'Edit',
          icon: <Pencil className="h-4 w-4" />,
          onClick: () => {},
        }}
        secondaryActions={[
          { label: 'More', icon: <MoreHorizontal className="h-4 w-4" />, onClick: () => {} },
        ]}
        content={<p className="text-sm text-muted-foreground">Card with actions.</p>}
      />
      <CompactCard
        title="Clickable"
        onClick={() => console.log('clicked')}
        content={<p className="text-sm text-muted-foreground">Click to navigate.</p>}
      />
      <CompactCard title="Loading State" isLoading />
      <CompactCard
        title="Error State"
        isError
        error={new globalThis.Error('Something went wrong')}
        onRetry={() => {}}
      />
      <CompactCard title="Empty State" isEmpty emptyMessage="No items found" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual comparison of all card states for regression testing.',
      },
    },
  },
};
