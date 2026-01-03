import type { Meta, StoryObj } from '@storybook/react';
import { CardHeaderWithActions, CompactCardHeader } from './card-header-with-actions';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { TooltipProvider } from './tooltip';
import { Pencil, Copy, Trash2, Settings, TestTube2, Bot, Zap } from 'lucide-react';

const meta: Meta<typeof CardHeaderWithActions> = {
  title: 'Design System/UI/CardHeaderWithActions',
  component: CardHeaderWithActions,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Card className="max-w-md">
          <Story />
          <CardContent>
            <p className="text-sm text-muted-foreground">Card content goes here...</p>
          </CardContent>
        </Card>
      </TooltipProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Card header with title, description, and action buttons. Supports three layouts: stacked, inline, and dropdown.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CardHeaderWithActions>;

// ===================================================================
// LAYOUT VARIANTS
// ===================================================================

export const InlineLayout: Story = {
  args: {
    title: 'Agent Configuration',
    description: 'Configure AI agent settings',
    layout: 'inline',
    actions: (
      <>
        <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Edit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline layout with title on left and actions on right. Best for 1-2 actions.',
      },
    },
  },
};

export const StackedLayout: Story = {
  args: {
    title: 'Knowledge Extraction Pipeline',
    description: 'AI-powered knowledge extraction from messages',
    layout: 'stacked',
    actions: (
      <>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button variant="outline" size="sm">
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>
        <Button variant="outline" size="sm">
          <TestTube2 className="h-4 w-4 mr-2" />
          Test
        </Button>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Stacked layout with title full-width and actions below. Best for many actions.',
      },
    },
  },
};

export const DropdownLayout: Story = {
  args: {
    title: 'AI Agent: GPT-4 Analyzer',
    description: 'Semantic analysis and classification agent',
    layout: 'dropdown',
    dropdownActions: [
      { label: 'Edit', icon: Pencil, onClick: () => console.log('Edit') },
      { label: 'Copy', icon: Copy, onClick: () => console.log('Copy') },
      { label: 'Configure', icon: Settings, onClick: () => console.log('Configure') },
      { label: 'Test', icon: TestTube2, onClick: () => console.log('Test') },
      { label: 'Delete', icon: Trash2, onClick: () => console.log('Delete'), variant: 'destructive', separatorBefore: true },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Dropdown layout with title full-width and actions in overflow menu. Most compact.',
      },
    },
  },
};

// ===================================================================
// WITH ICON AND BADGE
// ===================================================================

export const WithIconAndBadge: Story = {
  args: {
    title: 'Knowledge Extraction',
    description: 'Extract structured knowledge from messages',
    layout: 'inline',
    icon: <Bot className="h-5 w-5 text-primary" />,
    badge: <Badge variant="outline">Active</Badge>,
    actions: (
      <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Settings">
        <Settings className="h-4 w-4" />
      </Button>
    ),
  },
};

export const WithCustomBadge: Story = {
  args: {
    title: 'GPT-4 Provider',
    icon: <Zap className="h-5 w-5 text-semantic-warning" />,
    badge: (
      <Badge variant="outline" className="bg-semantic-success/10 text-semantic-success border-semantic-success">
        Connected
      </Badge>
    ),
    layout: 'dropdown',
    dropdownActions: [
      { label: 'Refresh', onClick: () => console.log('Refresh') },
      { label: 'Disconnect', onClick: () => console.log('Disconnect'), variant: 'destructive' },
    ],
  },
};

// ===================================================================
// LONG TITLE TRUNCATION
// ===================================================================

export const LongTitleTruncation: Story = {
  args: {
    title: 'Knowledge Extraction Pipeline with Advanced Semantic Analysis and Classification',
    description: 'This is a very long description that explains the purpose of this component in great detail',
    layout: 'inline',
    truncateTitle: true,
    actions: (
      <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Edit">
        <Pencil className="h-4 w-4" />
      </Button>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Long titles are automatically truncated with a tooltip showing the full text.',
      },
    },
  },
};

export const LongTitleNoTruncation: Story = {
  args: {
    title: 'Knowledge Extraction Pipeline with Advanced Semantic Analysis',
    layout: 'stacked',
    truncateTitle: false,
    actions: (
      <Button variant="outline" size="sm">Settings</Button>
    ),
  },
};

// ===================================================================
// AUTO LAYOUT SWITCH
// ===================================================================

export const AutoLayoutSwitch: Story = {
  args: {
    title: 'Auto Layout Detection',
    description: 'Layout automatically switches from inline to stacked when actions exceed limit',
    layout: 'inline',
    inlineMaxActions: 2,
    actions: (
      <>
        <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Edit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Copy">
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'When actions exceed inlineMaxActions (default 2), layout automatically switches to stacked.',
      },
    },
  },
};

// ===================================================================
// COMPACT HEADER VARIANT
// ===================================================================

export const CompactHeader: StoryObj<typeof CompactCardHeader> = {
  render: () => (
    <TooltipProvider>
      <Card className="max-w-md">
        <CompactCardHeader
          title="Quick Settings"
          action={
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
        <CardContent>
          <p className="text-sm text-muted-foreground">Compact header with minimal padding.</p>
        </CardContent>
      </Card>
    </TooltipProvider>
  ),
};

// ===================================================================
// REAL-WORLD EXAMPLE: AGENT CARD
// ===================================================================

export const AgentCardExample: Story = {
  render: () => (
    <TooltipProvider>
      <Card className="max-w-sm">
        <CardHeaderWithActions
          title="Knowledge Extraction"
          description="GPT-4 based semantic analysis"
          layout="dropdown"
          icon={<Bot className="h-5 w-5 text-primary" />}
          badge={
            <Badge variant="outline" className="bg-semantic-success/10 text-semantic-success border-semantic-success">
              Active
            </Badge>
          }
          dropdownActions={[
            { label: 'Edit', icon: Pencil, onClick: () => {} },
            { label: 'Duplicate', icon: Copy, onClick: () => {} },
            { label: 'Manage Tasks', icon: Settings, onClick: () => {} },
            { label: 'Test Agent', icon: TestTube2, onClick: () => {} },
            { label: 'Delete', icon: Trash2, onClick: () => {}, variant: 'destructive', separatorBefore: true },
          ]}
          dropdownLabel="Agent actions"
        />
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Model:</span>
              <span className="ml-2 font-mono">gpt-4o</span>
            </div>
            <div>
              <span className="text-muted-foreground">Temperature:</span>
              <span className="ml-2">0.7</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world example showing how to refactor AgentCard with the new component.',
      },
    },
  },
};
