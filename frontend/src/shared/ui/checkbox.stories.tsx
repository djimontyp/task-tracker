import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './checkbox';
import { Label } from './label';

/**
 * Checkbox component for binary choices.
 *
 * ## Design System Rules
 * - Minimum touch target 44x44px (wrap in Label or div)
 * - Always pair with Label for accessibility
 * - Use semantic spacing (gap-2 = 8px)
 * - Include aria-label if no visible label
 */
const meta: Meta<typeof Checkbox> = {
  title: 'UI/Forms/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Checked state',
    },
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
          'Checkbox input built on Radix UI Checkbox primitive. Supports checked, unchecked, and indeterminate states.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

// Basic variants
export const Default: Story = {
  args: {
    'aria-label': 'Checkbox',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms" className="cursor-pointer">
        Accept terms and conditions
      </Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Checkbox with Label for accessibility. Use cursor-pointer on Label for better UX. This creates a 44x44px clickable area.',
      },
    },
  },
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="checked" defaultChecked />
      <Label htmlFor="checked" className="cursor-pointer">
        Checked by default
      </Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="disabled" disabled />
      <Label htmlFor="disabled">Disabled checkbox</Label>
    </div>
  ),
};

export const DisabledChecked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="disabled-checked" disabled checked />
      <Label htmlFor="disabled-checked">Disabled and checked</Label>
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="required" required />
      <Label htmlFor="required" className="cursor-pointer">
        I agree <span className="text-destructive">*</span>
      </Label>
    </div>
  ),
};

// Multiple checkboxes
export const CheckboxGroup: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="opt1" defaultChecked />
        <Label htmlFor="opt1" className="cursor-pointer">
          Email notifications
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="opt2" />
        <Label htmlFor="opt2" className="cursor-pointer">
          SMS notifications
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="opt3" defaultChecked />
        <Label htmlFor="opt3" className="cursor-pointer">
          Push notifications
        </Label>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple checkboxes with consistent spacing (space-y-4 = 16px).',
      },
    },
  },
};

// With description
export const WithDescription: Story = {
  render: () => (
    <div className="flex items-start space-x-2">
      <Checkbox id="marketing" className="mt-2" />
      <div className="grid gap-2.5 leading-none">
        <Label htmlFor="marketing" className="cursor-pointer">
          Marketing emails
        </Label>
        <p className="text-sm text-muted-foreground">
          Receive emails about new products, features, and more.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Checkbox with label and description. Use items-start alignment.',
      },
    },
  },
};

// Form example
export const PreferencesForm: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-medium">Email Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox id="pref1" defaultChecked className="mt-2" />
            <div className="grid gap-2.5 leading-none">
              <Label htmlFor="pref1" className="cursor-pointer">
                Product updates
              </Label>
              <p className="text-sm text-muted-foreground">
                News about product and feature updates.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="pref2" className="mt-2" />
            <div className="grid gap-2.5 leading-none">
              <Label htmlFor="pref2" className="cursor-pointer">
                Weekly digest
              </Label>
              <p className="text-sm text-muted-foreground">Summary of activity from the past week.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="pref3" defaultChecked className="mt-2" />
            <div className="grid gap-2.5 leading-none">
              <Label htmlFor="pref3" className="cursor-pointer">
                Security alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Important notifications about your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete preferences form with grouped checkboxes and descriptions.',
      },
    },
  },
};
