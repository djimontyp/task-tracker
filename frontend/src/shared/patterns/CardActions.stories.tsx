import type { Meta, StoryObj } from '@storybook/react';
import {
  CardActions,
  IconButtonGroup,
  ResponsiveActions,
} from './CardActions';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { TooltipProvider } from '@/shared/ui/tooltip';
import {
  Pencil,
  Copy,
  Trash2,
  Settings,
  TestTube2,
  Download,
  Share2,
  MoreHorizontal,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react';

const meta: Meta<typeof CardActions> = {
  title: 'Design System/Patterns/CardActions',
  component: CardActions,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="max-w-md">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Responsive action button container. Primary actions are always visible, secondary actions collapse to dropdown on mobile.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CardActions>;

// ===================================================================
// BASIC EXAMPLES
// ===================================================================

export const Default: Story = {
  args: {
    primary: <Button>Save</Button>,
    secondary: [
      <Button key="cancel" variant="outline">
        Cancel
      </Button>,
    ],
  },
};

export const WithDropdownItems: Story = {
  args: {
    primary: <Button>Edit</Button>,
    dropdownItems: [
      { label: 'Duplicate', icon: Copy, onClick: () => console.log('Duplicate') },
      { label: 'Download', icon: Download, onClick: () => console.log('Download') },
      { label: 'Share', icon: Share2, onClick: () => console.log('Share') },
      {
        label: 'Delete',
        icon: Trash2,
        onClick: () => console.log('Delete'),
        variant: 'destructive',
        separatorBefore: true,
      },
    ],
  },
};

// ===================================================================
// LAYOUT VARIANTS
// ===================================================================

export const InlineLayout: Story = {
  args: {
    layout: 'inline',
    primary: (
      <>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button variant="outline" size="sm">
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
      </>
    ),
    dropdownItems: [
      { label: 'Settings', icon: Settings, onClick: () => {} },
      { label: 'Delete', icon: Trash2, onClick: () => {}, variant: 'destructive' },
    ],
  },
};

export const StackedLayout: Story = {
  args: {
    layout: 'stacked',
    primary: <Button className="w-full">Run Analysis</Button>,
    secondary: [
      <Button key="configure" variant="outline" className="w-full">
        Configure
      </Button>,
      <Button key="cancel" variant="ghost" className="w-full">
        Cancel
      </Button>,
    ],
  },
};

// ===================================================================
// ALIGNMENT
// ===================================================================

export const AlignStart: Story = {
  args: {
    align: 'start',
    primary: <Button>Action</Button>,
    secondary: [
      <Button key="secondary" variant="outline">
        Secondary
      </Button>,
    ],
  },
};

export const AlignBetween: Story = {
  args: {
    align: 'between',
    primary: <Button variant="ghost">Cancel</Button>,
    secondary: [<Button key="save">Save Changes</Button>],
  },
};

// ===================================================================
// COLLAPSE BREAKPOINTS
// ===================================================================

export const CollapseAtSm: Story = {
  args: {
    collapseAt: 'sm',
    primary: <Button>Primary</Button>,
    secondary: [
      <Button key="1" variant="outline">
        Action 1
      </Button>,
      <Button key="2" variant="outline">
        Action 2
      </Button>,
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Secondary actions collapse to dropdown at small breakpoint.',
      },
    },
  },
};

export const CollapseAtLg: Story = {
  args: {
    collapseAt: 'lg',
    primary: <Button>Primary</Button>,
    secondary: [
      <Button key="1" variant="outline">
        Action 1
      </Button>,
      <Button key="2" variant="outline">
        Action 2
      </Button>,
    ],
  },
};

// ===================================================================
// ICON BUTTON GROUP
// ===================================================================

export const IconButtons: StoryObj<typeof IconButtonGroup> = {
  render: () => (
    <IconButtonGroup
      actions={[
        { icon: Pencil, label: 'Edit', onClick: () => console.log('Edit') },
        { icon: Copy, label: 'Copy', onClick: () => console.log('Copy') },
        { icon: Settings, label: 'Settings', onClick: () => console.log('Settings') },
        { icon: Trash2, label: 'Delete', onClick: () => console.log('Delete'), variant: 'destructive' },
      ]}
    />
  ),
};

export const SmallIconButtons: StoryObj<typeof IconButtonGroup> = {
  render: () => (
    <IconButtonGroup
      size="sm"
      actions={[
        { icon: Play, label: 'Play', onClick: () => {} },
        { icon: Pause, label: 'Pause', onClick: () => {} },
        { icon: RefreshCw, label: 'Refresh', onClick: () => {} },
      ]}
    />
  ),
};

// ===================================================================
// RESPONSIVE ACTIONS
// ===================================================================

export const ResponsiveActionButtons: StoryObj<typeof ResponsiveActions> = {
  render: () => (
    <ResponsiveActions
      visible={[
        { icon: Pencil, label: 'Edit', onClick: () => {} },
        { icon: Copy, label: 'Copy', onClick: () => {} },
      ]}
      collapsed={[
        { label: 'Settings', icon: Settings, onClick: () => {} },
        { label: 'Test', icon: TestTube2, onClick: () => {} },
        { label: 'Delete', icon: Trash2, onClick: () => {}, variant: 'destructive', separatorBefore: true },
      ]}
      collapseAt="md"
      dropdownLabel="More actions"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon buttons that collapse to dropdown on smaller screens. Resize the viewport to see the behavior.',
      },
    },
  },
};

// ===================================================================
// REAL-WORLD EXAMPLES
// ===================================================================

export const AgentCardActions: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg">Knowledge Extraction</CardTitle>
          <ResponsiveActions
            visible={[{ icon: Pencil, label: 'Edit', onClick: () => {} }]}
            collapsed={[
              { label: 'Copy', icon: Copy, onClick: () => {} },
              { label: 'Manage Tasks', icon: Settings, onClick: () => {} },
              { label: 'Test', icon: TestTube2, onClick: () => {} },
              { label: 'Delete', icon: Trash2, onClick: () => {}, variant: 'destructive', separatorBefore: true },
            ]}
            collapseAt="sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">AI-powered knowledge extraction agent.</p>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of how to use ResponsiveActions in an AgentCard header.',
      },
    },
  },
};

export const DialogFooterActions: Story = {
  render: () => (
    <div className="border-t pt-4 mt-4">
      <CardActions
        align="between"
        primary={
          <Button variant="ghost" className="text-destructive hover:text-destructive">
            Delete Agent
          </Button>
        }
        secondary={[
          <Button key="cancel" variant="outline">
            Cancel
          </Button>,
          <Button key="save">Save Changes</Button>,
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'CardActions used in dialog footer with between alignment.',
      },
    },
  },
};

export const ToolbarActions: Story = {
  render: () => (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Selected: 5 items</h3>
        <CardActions
          primary={
            <IconButtonGroup
              size="sm"
              actions={[
                { icon: Download, label: 'Download', onClick: () => {} },
                { icon: Share2, label: 'Share', onClick: () => {} },
              ]}
            />
          }
          dropdownItems={[
            { label: 'Move to...', onClick: () => {} },
            { label: 'Add to project', onClick: () => {} },
            { label: 'Delete', icon: Trash2, onClick: () => {}, variant: 'destructive', separatorBefore: true },
          ]}
        />
      </div>
    </div>
  ),
};

// ===================================================================
// DISABLED STATES
// ===================================================================

export const WithDisabledActions: StoryObj<typeof IconButtonGroup> = {
  render: () => (
    <IconButtonGroup
      actions={[
        { icon: Pencil, label: 'Edit', onClick: () => {} },
        { icon: Copy, label: 'Copy', onClick: () => {}, disabled: true },
        { icon: Trash2, label: 'Delete', onClick: () => {}, variant: 'destructive', disabled: true },
      ]}
    />
  ),
};

export const DropdownWithDisabled: Story = {
  args: {
    primary: <Button>Action</Button>,
    dropdownItems: [
      { label: 'Edit', icon: Pencil, onClick: () => {} },
      { label: 'Copy (disabled)', icon: Copy, onClick: () => {}, disabled: true },
      { label: 'Delete', icon: Trash2, onClick: () => {}, variant: 'destructive' },
    ],
  },
};

// ===================================================================
// COMBINATION WITH CARD
// ===================================================================

export const FullCardExample: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg truncate">Analysis Pipeline Configuration</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure the ML pipeline for message analysis
            </p>
          </div>
          <IconButtonGroup
            actions={[
              { icon: Settings, label: 'Settings', onClick: () => {} },
              { icon: MoreHorizontal, label: 'More', onClick: () => {} },
            ]}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Model:</span>
              <p className="font-mono">gpt-4o</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="text-semantic-success">Active</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};
