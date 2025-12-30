import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminFeatureBadge } from './AdminFeatureBadge';
import { useUiStore } from '@/shared/store/uiStore';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { useEffect } from 'react';

// Decorator to set admin mode state
const AdminModeDecorator = (isAdmin: boolean) => (Story: React.ComponentType) => {
  useEffect(() => {
    useUiStore.setState({ isAdminMode: isAdmin });
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

const meta: Meta<typeof AdminFeatureBadge> = {
  title: 'Components/AdminFeatureBadge',
  component: AdminFeatureBadge,
  tags: ['autodocs'],
  decorators: [AdminModeDecorator(true)],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Badge indicating admin-only features. Only visible when Admin Mode is enabled. Shows tooltip on hover.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['inline', 'floating'],
      description: 'Badge positioning variant',
      table: {
        defaultValue: { summary: 'inline' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Badge size',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    text: {
      control: 'text',
      description: 'Badge text content',
      table: {
        defaultValue: { summary: 'Admin Only' },
      },
    },
    tooltip: {
      control: 'text',
      description: 'Tooltip text on hover',
    },
    showIcon: {
      control: 'boolean',
      description: 'Whether to show shield icon',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof AdminFeatureBadge>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default admin badge with icon and standard text.',
      },
    },
  },
};

export const Inline: Story = {
  args: {
    variant: 'inline',
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline variant for placement next to other content.',
      },
    },
  },
};

export const Floating: Story = {
  render: () => (
    <div className="relative p-8 border rounded-lg w-64 h-32">
      <span className="font-medium">Settings Panel</span>
      <AdminFeatureBadge variant="floating" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Floating variant positioned absolutely in container (top-right).',
      },
    },
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Small size for compact layouts.',
      },
    },
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Large size for prominent display.',
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <AdminFeatureBadge size="sm" />
      <AdminFeatureBadge size="default" />
      <AdminFeatureBadge size="lg" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all size variants.',
      },
    },
  },
};

export const CustomText: Story = {
  args: {
    text: 'Debug Mode',
    tooltip: 'This feature is only visible in Debug Mode',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge with custom text and tooltip.',
      },
    },
  },
};

export const WithoutIcon: Story = {
  args: {
    showIcon: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge without the shield icon.',
      },
    },
  },
};

export const InCardHeader: Story = {
  render: () => (
    <div className="p-4 border rounded-lg w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">LLM Providers</h3>
        <AdminFeatureBadge variant="inline" size="sm" className="ml-0" />
      </div>
      <p className="text-sm text-muted-foreground">
        Configure OpenAI and Ollama providers for AI analysis.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badge in a typical card header context.',
      },
    },
  },
};

export const HiddenWhenNotAdmin: Story = {
  decorators: [AdminModeDecorator(false)],
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Badge is hidden when Admin Mode is disabled (nothing renders).',
      },
    },
  },
};
