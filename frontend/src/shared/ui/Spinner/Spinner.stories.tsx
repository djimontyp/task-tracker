import type { Meta, StoryObj } from '@storybook/react-vite';
import Spinner from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Loading indicator with configurable sizes. Uses animated SVG with primary color.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the spinner',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the container',
    },
  },
};
export default meta;

type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Small spinner (16x16px) for inline loading indicators.',
      },
    },
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Medium spinner (32x32px) - default size for general use.',
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
        story: 'Large spinner (48x48px) for full-page loading states.',
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="sm" />
        <span className="text-sm text-muted-foreground">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" />
        <span className="text-sm text-muted-foreground">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" />
        <span className="text-sm text-muted-foreground">Large</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all available spinner sizes.',
      },
    },
  },
};

export const WithCustomClassName: Story = {
  args: {
    size: 'md',
    className: 'bg-muted p-4 rounded-lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Spinner with custom container styling via className prop.',
      },
    },
  },
};

export const InlineWithText: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Spinner size="sm" />
      <span className="text-sm">Loading data...</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Small spinner used inline with loading text.',
      },
    },
  },
};

export const CenteredInContainer: Story = {
  render: () => (
    <div className="h-48 w-64 rounded-lg border border-dashed border-muted-foreground flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Spinner centered within a container, common for card loading states.',
      },
    },
  },
};
