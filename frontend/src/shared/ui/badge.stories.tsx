import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from './badge';

/**
 * Badge component for status indicators and labels.
 *
 * ## Design System Rules
 * - Status badges must include icon + text (WCAG 1.4.1 - not color alone)
 * - Use semantic variants: `success`, `warning`, `destructive`
 * - For custom status colors, use outline variant with semantic border/text colors
 */
const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning'],
      description: 'Visual style variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// Basic variants
export const Default: Story = {
  args: {
    children: 'Default Badge',
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Error',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
};

// Status badges with icons (WCAG compliant)
export const StatusConnected: Story = {
  render: () => (
    <Badge variant="outline" className="gap-2 border-status-connected text-status-connected">
      <CheckCircle className="h-3.5 w-3.5" />
      Connected
    </Badge>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Status badge with icon + text. Never use color alone to convey status (WCAG 1.4.1).',
      },
    },
  },
};

export const StatusError: Story = {
  render: () => (
    <Badge variant="outline" className="gap-2 border-status-error text-status-error">
      <XCircle className="h-3.5 w-3.5" />
      Error
    </Badge>
  ),
};

export const StatusValidating: Story = {
  render: () => (
    <Badge variant="outline" className="gap-2 border-status-validating text-status-validating">
      <Clock className="h-3.5 w-3.5" />
      Validating
    </Badge>
  ),
};

export const StatusPending: Story = {
  render: () => (
    <Badge variant="outline" className="gap-2 border-status-pending text-status-pending">
      <AlertCircle className="h-3.5 w-3.5" />
      Pending
    </Badge>
  ),
};

// All status badges
export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className="gap-2 border-status-connected text-status-connected">
        <CheckCircle className="h-3.5 w-3.5" />
        Connected
      </Badge>
      <Badge variant="outline" className="gap-2 border-status-validating text-status-validating">
        <Clock className="h-3.5 w-3.5" />
        Validating
      </Badge>
      <Badge variant="outline" className="gap-2 border-status-pending text-status-pending">
        <AlertCircle className="h-3.5 w-3.5" />
        Pending
      </Badge>
      <Badge variant="outline" className="gap-2 border-status-error text-status-error">
        <XCircle className="h-3.5 w-3.5" />
        Error
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All status badge variants with proper icon + text pattern.',
      },
    },
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
    </div>
  ),
};

// Glow variant
export const ImportantWithGlow: Story = {
  render: () => (
    <div className="p-8 bg-background">
      <p className="text-sm text-muted-foreground mb-4">Important badge with subtle glow</p>
      <div className="flex flex-wrap gap-4">
        <Badge variant="default" className="shadow-glow-sm">
          Featured
        </Badge>
        <Badge variant="outline" className="gap-2 border-primary text-primary shadow-glow-sm">
          <CheckCircle className="h-3.5 w-3.5" />
          Important
        </Badge>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badge with subtle glow effect for highlighting important labels or status indicators.',
      },
    },
  },
};
