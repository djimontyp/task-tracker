/**
 * ExpandedCard Storybook Stories
 *
 * Desktop-first card variant with full content layout.
 * All stories demonstrate the component at desktop viewport.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExpandedCard } from './ExpandedCard';
import { CardActions } from './CardActions';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { TooltipProvider } from '@/shared/ui/tooltip';
import {
  Bot,
  Pencil,
  Copy,
  Trash2,
  Settings,
  TestTube2,
  CheckCircle,
  Clock,
  Cpu,
  Zap,
} from 'lucide-react';

// ===================================================================
// META
// ===================================================================

const meta: Meta<typeof ExpandedCard> = {
  title: 'Design System/Patterns/ExpandedCard',
  component: ExpandedCard,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="max-w-2xl p-6 bg-background">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        component: `
Desktop-first card variant optimized for larger screens (>=640px).

**Key features:**
- Full header with title and optional actions
- Structured metadata via DataList component
- Description section for text content
- Footer slot for additional content
- Touch targets >= 44px (WCAG compliant)
- Hidden on mobile (hidden sm:block)

**Use cases:**
- AgentCard desktop variant
- ProjectCard desktop variant
- TopicCard desktop variant
- Any card needing detailed metadata display
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ExpandedCard>;

// ===================================================================
// STORIES
// ===================================================================

/**
 * Default card with header and metadata only.
 */
export const Default: Story = {
  args: {
    header: (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Knowledge Extractor</h3>
          <p className="text-sm text-muted-foreground">AI Agent</p>
        </div>
      </div>
    ),
    metadata: [
      { label: 'Model', value: 'gpt-4o' },
      { label: 'Temperature', value: '0.7' },
      { label: 'Max Tokens', value: '4096' },
      { label: 'Status', value: <Badge variant="outline">Active</Badge> },
    ],
  },
};

/**
 * Card with CardActions integration for edit/delete/more actions.
 */
export const WithActions: Story = {
  args: {
    header: (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-semantic-success/10">
          <CheckCircle className="h-5 w-5 text-semantic-success" />
        </div>
        <div>
          <h3 className="font-semibold">Message Analyzer</h3>
          <p className="text-sm text-muted-foreground">Classification Agent</p>
        </div>
      </div>
    ),
    actions: (
      <CardActions
        primary={
          <Button variant="outline" size="icon" className="h-11 w-11">
            <Pencil className="h-4 w-4" />
          </Button>
        }
        dropdownItems={[
          {
            label: 'Copy',
            icon: Copy,
            onClick: () => console.log('Copy clicked'),
          },
          {
            label: 'Manage Tasks',
            icon: Settings,
            onClick: () => console.log('Manage Tasks clicked'),
          },
          {
            label: 'Test',
            icon: TestTube2,
            onClick: () => console.log('Test clicked'),
          },
          {
            label: 'Delete',
            icon: Trash2,
            onClick: () => console.log('Delete clicked'),
            variant: 'destructive',
          },
        ]}
      />
    ),
    metadata: [
      { label: 'Model', value: 'gpt-4o' },
      { label: 'Temperature', value: '0.7' },
    ],
  },
};

/**
 * Card with description text content.
 */
export const WithDescription: Story = {
  args: {
    header: (
      <div>
        <h3 className="font-semibold text-lg">Pulse Radar</h3>
        <p className="text-sm text-muted-foreground">Knowledge Management System</p>
      </div>
    ),
    description:
      'AI-powered knowledge extraction from communication channels. Automatically processes messages from Telegram and Slack to identify important insights, decisions, and action items.',
    metadata: [
      { label: 'Messages Processed', value: '12,345' },
      { label: 'Atoms Created', value: '2,341' },
      { label: 'Active Topics', value: '89' },
      { label: 'Success Rate', value: '95.6%' },
    ],
    metadataColumns: 2,
  },
};

/**
 * Card with footer slot for additional content.
 */
export const WithFooter: Story = {
  args: {
    header: (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-semantic-info/10">
          <Cpu className="h-5 w-5 text-semantic-info" />
        </div>
        <div>
          <h3 className="font-semibold">LLM Provider</h3>
          <p className="text-sm text-muted-foreground">OpenAI Configuration</p>
        </div>
      </div>
    ),
    metadata: [
      { label: 'Provider', value: 'OpenAI' },
      { label: 'Model', value: 'gpt-4o' },
      { label: 'API Key', value: <code className="text-xs bg-muted px-2 py-0.5 rounded">sk-...4f2a</code> },
      {
        label: 'Status',
        value: (
          <Badge variant="outline" className="bg-semantic-success/10 text-semantic-success border-semantic-success">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Connected
          </Badge>
        ),
      },
    ],
    footer: (
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Last validated 2 hours ago</p>
        <Button variant="outline" size="sm">
          Revalidate
        </Button>
      </div>
    ),
  },
};

/**
 * Loading state with skeleton placeholders.
 */
export const Loading: Story = {
  args: {
    header: <h3>Loading...</h3>,
    isLoading: true,
  },
};

/**
 * Error state without retry handler.
 */
export const Error: Story = {
  args: {
    header: <h3>Failed Card</h3>,
    isError: true,
    error: new globalThis.Error('Failed to fetch agent configuration'),
  },
};

/**
 * Error state with retry handler.
 */
export const ErrorWithRetry: Story = {
  args: {
    header: <h3>Failed Card</h3>,
    isError: true,
    error: new globalThis.Error('Network request failed: Connection timeout'),
    onRetry: () => console.log('Retry clicked'),
  },
};

/**
 * Empty state with custom message.
 */
export const Empty: Story = {
  args: {
    header: <h3>Empty Card</h3>,
    isEmpty: true,
    emptyMessage: 'No agents configured yet. Create your first agent to get started.',
  },
};

/**
 * Clickable navigation card with hover effects.
 */
export const Interactive: Story = {
  args: {
    header: (
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: '#3b82f6' }}
        >
          <span className="text-lg text-white">FE</span>
        </div>
        <div>
          <h3 className="font-semibold">Frontend Development</h3>
          <p className="text-sm text-muted-foreground">42 atoms, 156 messages</p>
        </div>
      </div>
    ),
    description: 'All frontend-related knowledge atoms and discussions about React, TypeScript, and UI patterns.',
    onClick: () => console.log('Card clicked - navigate to topic'),
    'aria-label': 'Navigate to Frontend Development topic',
  },
  parameters: {
    docs: {
      description: {
        story: 'Clickable card for navigation. Has hover state and keyboard support (Enter/Space).',
      },
    },
  },
};

/**
 * Kitchen sink: all features combined.
 */
export const AllFeatures: Story = {
  args: {
    header: (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-semantic-warning/10">
          <Zap className="h-5 w-5 text-semantic-warning" />
        </div>
        <div>
          <h3 className="font-semibold">Knowledge Extraction Agent</h3>
          <p className="text-sm text-muted-foreground">Pydantic AI Agent</p>
        </div>
      </div>
    ),
    actions: (
      <CardActions
        primary={
          <Button variant="outline" size="icon" className="h-11 w-11" aria-label="Edit agent">
            <Pencil className="h-4 w-4" />
          </Button>
        }
        dropdownItems={[
          { label: 'Copy', icon: Copy, onClick: () => {} },
          { label: 'Test', icon: TestTube2, onClick: () => {} },
          { label: 'Delete', icon: Trash2, onClick: () => {}, variant: 'destructive' },
        ]}
      />
    ),
    description:
      'Extracts structured knowledge atoms from incoming messages using GPT-4. Identifies problems, solutions, decisions, and insights with high accuracy.',
    metadata: [
      { label: 'Model', value: <code className="text-xs font-mono">gpt-4o</code> },
      { label: 'Temperature', value: '0.7' },
      { label: 'Max Tokens', value: '4096' },
      {
        label: 'Status',
        value: (
          <Badge variant="outline" className="bg-semantic-success/10 text-semantic-success border-semantic-success">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Active
          </Badge>
        ),
      },
    ],
    metadataColumns: 2,
    metadataDensity: 'compact',
    footer: (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Last run: 5 minutes ago
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            View Logs
          </Button>
          <Button size="sm">Run Now</Button>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Full-featured card demonstrating all available props: header, actions, description, metadata, and footer.',
      },
    },
  },
};

/**
 * All states comparison for visual testing.
 */
export const AllStates: Story = {
  render: () => (
    <div className="space-y-6">
      <ExpandedCard
        header={
          <div>
            <h3 className="font-semibold">Default State</h3>
            <p className="text-sm text-muted-foreground">Normal card with metadata</p>
          </div>
        }
        metadata={[
          { label: 'Key 1', value: 'Value 1' },
          { label: 'Key 2', value: 'Value 2' },
        ]}
      />
      <ExpandedCard
        header={
          <div>
            <h3 className="font-semibold">With Description</h3>
            <p className="text-sm text-muted-foreground">Card with text content</p>
          </div>
        }
        description="This is a description that provides additional context about the card content."
      />
      <ExpandedCard
        header={<h3 className="font-semibold">Clickable Card</h3>}
        description="Click to navigate to details page."
        onClick={() => console.log('clicked')}
      />
      <ExpandedCard header={<h3>Loading State</h3>} isLoading />
      <ExpandedCard
        header={<h3>Error State</h3>}
        isError
        error={new globalThis.Error('Something went wrong')}
        onRetry={() => {}}
      />
      <ExpandedCard header={<h3>Empty State</h3>} isEmpty emptyMessage="No items found" />
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
