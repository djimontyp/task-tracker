import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AutoSaveToggle } from './AutoSaveToggle';

const meta: Meta<typeof AutoSaveToggle> = {
  title: 'Components/AutoSaveToggle',
  component: AutoSaveToggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Toggle switch for auto-save functionality. Typically shown in form headers or settings panels.',
      },
    },
  },
  argTypes: {
    enabled: {
      control: 'boolean',
      description: 'Whether auto-save is enabled',
    },
    onToggle: {
      action: 'toggled',
      description: 'Callback when toggle state changes',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};
export default meta;

type Story = StoryObj<typeof AutoSaveToggle>;

export const Enabled: Story = {
  args: {
    enabled: true,
    onToggle: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Auto-save enabled state - switch is on.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    enabled: false,
    onToggle: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Auto-save disabled state - switch is off.',
      },
    },
  },
};

export const Interactive: Story = {
  render: function InteractiveAutoSave() {
    const [enabled, setEnabled] = useState(true);
    return (
      <div className="flex flex-col items-center gap-4">
        <AutoSaveToggle enabled={enabled} onToggle={setEnabled} />
        <span className="text-sm text-muted-foreground">
          Status: {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example - click to toggle auto-save.',
      },
    },
  },
};

export const InFormHeader: Story = {
  render: function FormHeaderExample() {
    const [enabled, setEnabled] = useState(true);
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg max-w-md w-full">
        <h3 className="font-medium">Settings</h3>
        <AutoSaveToggle enabled={enabled} onToggle={setEnabled} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Auto-save toggle in a typical form header layout.',
      },
    },
  },
};

export const WithCustomClass: Story = {
  args: {
    enabled: true,
    onToggle: () => {},
    className: 'bg-muted p-2 rounded-lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle with custom container styling.',
      },
    },
  },
};
