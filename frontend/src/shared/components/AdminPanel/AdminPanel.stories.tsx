import { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminPanel } from './AdminPanel';
import { useUiStore } from '@/shared/store/uiStore';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

// Decorator to set admin mode state
const AdminModeDecorator = (Story: React.ComponentType) => {
  useEffect(() => {
    useUiStore.setState({ isAdminMode: true });
    return () => {
      useUiStore.setState({ isAdminMode: false });
    };
  }, []);

  return (
    <TooltipProvider>
      <Story />
    </TooltipProvider>
  );
};

const meta: Meta<typeof AdminPanel> = {
  title: 'Components/AdminPanel',
  component: AdminPanel,
  tags: ['autodocs'],
  decorators: [AdminModeDecorator],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Collapsible admin panel for admin-only features. Shows warning-colored header with expand/collapse functionality.',
      },
    },
  },
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'Whether the panel is visible',
    },
    onToggle: {
      action: 'toggled',
      description: 'Callback when panel is toggled',
    },
  },
};
export default meta;

type Story = StoryObj<typeof AdminPanel>;

export const Default: Story = {
  args: {
    visible: true,
    children: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Admin-only controls and settings appear here.
        </p>
        <Button size="sm">Run Analysis</Button>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default admin panel with simple content.',
      },
    },
  },
};

export const Hidden: Story = {
  args: {
    visible: false,
    children: <p>This content is hidden</p>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Panel when visible=false - nothing renders.',
      },
    },
  },
};

export const WithFormContent: Story = {
  args: {
    visible: true,
    children: (
      <div className="space-y-4 max-w-md">
        <div className="space-y-2">
          <label className="text-sm font-medium">API Key</label>
          <Input type="password" placeholder="sk-..." />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Model</label>
          <Input placeholder="gpt-4" defaultValue="gpt-4-turbo" />
        </div>
        <div className="flex gap-2">
          <Button size="sm">Save</Button>
          <Button size="sm" variant="outline">Reset</Button>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin panel with form content for configuration.',
      },
    },
  },
};

export const Interactive: Story = {
  render: function InteractiveAdminPanel() {
    const [visible, setVisible] = useState(true);

    return (
      <div className="space-y-4">
        <Button onClick={() => setVisible((v) => !v)}>
          {visible ? 'Hide Panel' : 'Show Panel'}
        </Button>
        <AdminPanel visible={visible}>
          <div className="flex items-center gap-4">
            <span className="text-sm">Debug mode controls</span>
            <Button size="sm" variant="destructive">Clear Cache</Button>
            <Button size="sm" variant="outline">Export Logs</Button>
          </div>
        </AdminPanel>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example - toggle panel visibility.',
      },
    },
  },
};

export const InPageLayout: Story = {
  render: () => (
    <div className="border rounded-lg overflow-hidden max-w-2xl">
      <div className="p-4 border-b bg-muted/50">
        <h2 className="font-semibold">Messages</h2>
      </div>
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          Showing 25 messages from the last 24 hours.
        </p>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 border rounded-lg text-sm">
              Message content {i}
            </div>
          ))}
        </div>
      </div>
      <AdminPanel visible>
        <div className="flex items-center gap-4">
          <Button size="sm">Re-analyze All</Button>
          <Button size="sm" variant="outline">Export JSON</Button>
          <Button size="sm" variant="outline">Clear Selection</Button>
        </div>
      </AdminPanel>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Admin panel at the bottom of a page section.',
      },
    },
  },
};
