import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Label } from './label';

/**
 * RadioGroup component for mutually exclusive choices.
 *
 * ## Design System Rules
 * - Minimum touch target 44x44px (wrap in Label)
 * - Always pair with Label for each option
 * - Use for 2-5 options; consider Select for more
 * - Default gap-2 (8px) between items
 */
const meta: Meta<typeof RadioGroup> = {
  title: 'UI/Forms/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    required: {
      control: 'boolean',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Radio group built on Radix UI RadioGroup primitive. Use for mutually exclusive choices.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

// Basic variants
export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option-1">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-1" id="option-1" />
        <Label htmlFor="option-1" className="cursor-pointer">
          Option 1
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-2" id="option-2" />
        <Label htmlFor="option-2" className="cursor-pointer">
          Option 2
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-3" id="option-3" />
        <Label htmlFor="option-3" className="cursor-pointer">
          Option 3
        </Label>
      </div>
    </RadioGroup>
  ),
};

export const WithGroupLabel: Story = {
  render: () => (
    <div className="grid gap-2">
      <Label>Choose a plan</Label>
      <RadioGroup defaultValue="basic">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="basic" id="basic" />
          <Label htmlFor="basic" className="cursor-pointer">
            Basic
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="pro" id="pro" />
          <Label htmlFor="pro" className="cursor-pointer">
            Pro
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="enterprise" id="enterprise" />
          <Label htmlFor="enterprise" className="cursor-pointer">
            Enterprise
          </Label>
        </div>
      </RadioGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Radio group with label describing the group purpose.',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup disabled defaultValue="option-1">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-1" id="d1" />
        <Label htmlFor="d1">Option 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-2" id="d2" />
        <Label htmlFor="d2">Option 2</Label>
      </div>
    </RadioGroup>
  ),
};

export const DisabledOption: Story = {
  render: () => (
    <RadioGroup defaultValue="option-1">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-1" id="do1" />
        <Label htmlFor="do1" className="cursor-pointer">
          Option 1
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-2" id="do2" disabled />
        <Label htmlFor="do2">Option 2 (Disabled)</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-3" id="do3" />
        <Label htmlFor="do3" className="cursor-pointer">
          Option 3
        </Label>
      </div>
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Individual radio items can be disabled.',
      },
    },
  },
};

// With descriptions
export const WithDescriptions: Story = {
  render: () => (
    <RadioGroup defaultValue="card">
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="card" id="card" className="mt-2" />
        <div className="grid gap-2.5 leading-none">
          <Label htmlFor="card" className="cursor-pointer">
            Credit Card
          </Label>
          <p className="text-sm text-muted-foreground">Pay with Visa, Mastercard, or Amex</p>
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="paypal" id="paypal" className="mt-2" />
        <div className="grid gap-2.5 leading-none">
          <Label htmlFor="paypal" className="cursor-pointer">
            PayPal
          </Label>
          <p className="text-sm text-muted-foreground">Pay with your PayPal account</p>
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="bank" id="bank" className="mt-2" />
        <div className="grid gap-2.5 leading-none">
          <Label htmlFor="bank" className="cursor-pointer">
            Bank Transfer
          </Label>
          <p className="text-sm text-muted-foreground">Direct bank transfer (2-3 business days)</p>
        </div>
      </div>
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Radio items with descriptions. Use items-start alignment and mt-1 on RadioGroupItem.',
      },
    },
  },
};

// Horizontal layout
export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="m" className="flex gap-4">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="s" id="s" />
        <Label htmlFor="s" className="cursor-pointer">
          Small
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="m" id="m" />
        <Label htmlFor="m" className="cursor-pointer">
          Medium
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="l" id="l" />
        <Label htmlFor="l" className="cursor-pointer">
          Large
        </Label>
      </div>
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Horizontal layout using flex instead of default grid.',
      },
    },
  },
};

// Form example
export const SubscriptionForm: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="grid gap-2">
        <Label className="text-base">Choose your plan</Label>
        <RadioGroup defaultValue="pro">
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="free" id="free" className="mt-2" />
            <div className="grid gap-2.5 leading-none">
              <Label htmlFor="free" className="cursor-pointer font-medium">
                Free
              </Label>
              <p className="text-sm text-muted-foreground">
                Perfect for trying out our service. Up to 10 projects.
              </p>
              <p className="text-sm font-semibold">$0/month</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="pro" id="pro" className="mt-2" />
            <div className="grid gap-2.5 leading-none">
              <Label htmlFor="pro" className="cursor-pointer font-medium">
                Pro
              </Label>
              <p className="text-sm text-muted-foreground">
                For professionals. Unlimited projects and priority support.
              </p>
              <p className="text-sm font-semibold">$19/month</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="team" id="team" className="mt-2" />
            <div className="grid gap-2.5 leading-none">
              <Label htmlFor="team" className="cursor-pointer font-medium">
                Team
              </Label>
              <p className="text-sm text-muted-foreground">
                For teams. Everything in Pro plus team collaboration.
              </p>
              <p className="text-sm font-semibold">$49/month</p>
            </div>
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete subscription form with pricing information.',
      },
    },
  },
};
