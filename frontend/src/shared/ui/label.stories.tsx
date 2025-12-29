import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from './label';
import { Input } from './input';
import { Checkbox } from './checkbox';

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Accessible label component based on Radix UI Label. Automatically associates with form controls and handles disabled states.',
      },
    },
  },
  argTypes: {
    htmlFor: {
      control: 'text',
      description: 'ID of the associated form element',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    children: {
      control: 'text',
      description: 'Label text content',
    },
  },
};
export default meta;

type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: 'Email address',
  },
};

export const WithInput: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Enter your email" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Label associated with an input field using htmlFor attribute.',
      },
    },
  },
};

export const Required: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="name">
        Name <span className="text-destructive">*</span>
      </Label>
      <Input type="text" id="name" placeholder="Enter your name" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Label with required field indicator.',
      },
    },
  },
};

export const WithDescription: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="password">Password</Label>
      <Input type="password" id="password" />
      <p className="text-sm text-muted-foreground">
        Must be at least 8 characters long.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Label with additional description text below the input.',
      },
    },
  },
};

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Label used inline with a checkbox control.',
      },
    },
  },
};

export const DisabledState: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="disabled-input">Disabled field</Label>
      <Input type="text" id="disabled-input" disabled placeholder="Cannot edit" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Label styling adjusts when the associated input is disabled (peer-disabled).',
      },
    },
  },
};

export const WithError: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="error-input" className="text-destructive">
        Email
      </Label>
      <Input
        type="email"
        id="error-input"
        className="border-destructive"
        defaultValue="invalid-email"
      />
      <p className="text-sm text-destructive">Please enter a valid email address.</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Label styled to indicate an error state.',
      },
    },
  },
};

export const FormLayout: Story = {
  render: () => (
    <form className="w-80 space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="form-name">
          Full name <span className="text-destructive">*</span>
        </Label>
        <Input type="text" id="form-name" placeholder="John Doe" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="form-email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input type="email" id="form-email" placeholder="john@example.com" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="form-phone">Phone (optional)</Label>
        <Input type="tel" id="form-phone" placeholder="+1 234 567 8900" />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="form-newsletter" />
        <Label htmlFor="form-newsletter">Subscribe to newsletter</Label>
      </div>
    </form>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete form layout example with various label patterns.',
      },
    },
  },
};
