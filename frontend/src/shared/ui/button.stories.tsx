import type { Meta, StoryObj } from '@storybook/react-vite';
import { Trash2, Plus, Send, Settings } from 'lucide-react';
import { Button } from './button';

/**
 * Button component with multiple variants and sizes.
 *
 * ## Design System Rules
 * - Icon buttons must be 44x44px for WCAG 2.5.5 touch target compliance
 * - Always provide aria-label for icon-only buttons
 * - Use semantic variants: `destructive` for delete, `default` for primary actions
 */
const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Button size. `icon` is 44x44px for touch targets',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner and disables button',
    },
    disabled: {
      control: 'boolean',
    },
    asChild: {
      control: 'boolean',
      description: 'Render as child element (for links)',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'A button component with multiple variants and sizes, following WCAG 2.1 AA guidelines.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Basic variants
export const Default: Story = {
  args: {
    children: 'Primary Action',
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Action',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete Item',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Link: Story = {
  args: {
    children: 'Link Button',
    variant: 'link',
  },
};

// Sizes
export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};

// Icon button - 44px touch target
export const IconButton: Story = {
  args: {
    variant: 'ghost',
    size: 'icon',
    'aria-label': 'Delete item',
    children: <Trash2 className="h-5 w-5" />,
  },
  parameters: {
    docs: {
      description: {
        story: '44x44px icon button for WCAG 2.5.5 touch target compliance. Always include aria-label.',
      },
    },
  },
};

// With icon
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Plus className="h-4 w-4" />
        Add Item
      </>
    ),
  },
};

export const WithIconRight: Story = {
  args: {
    children: (
      <>
        Send Message
        <Send className="h-4 w-4" />
      </>
    ),
  },
};

// States
export const Loading: Story = {
  args: {
    children: 'Saving...',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button variants side by side for comparison.',
      },
    },
  },
};

// All sizes showcase
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Settings">
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  ),
};

// Glow variant
export const PrimaryWithHoverGlow: Story = {
  args: {
    children: 'Featured Action',
    variant: 'default',
  },
  render: (args) => (
    <div className="p-8 bg-background">
      <p className="text-sm text-muted-foreground mb-4">Hover to see glow effect</p>
      <Button {...args} className="transition-all duration-300 hover:shadow-glow-hover" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Primary button with hover glow effect. Used for featured/important actions that need visual emphasis.',
      },
    },
  },
};
