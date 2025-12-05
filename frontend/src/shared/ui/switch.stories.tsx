import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from './switch';
import { Label } from './label';

/**
 * Switch component for toggle states.
 *
 * ## Design System Rules
 * - Minimum touch target 44x44px (wrap in Label or div with padding)
 * - Always pair with Label for accessibility
 * - Use for on/off settings, not for immediate actions
 * - Include aria-label if no visible label
 */
const meta: Meta<typeof Switch> = {
  title: 'UI/Forms/Switch',
  component: Switch,
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
          'Toggle switch built on Radix UI Switch primitive. Use for settings that take effect immediately.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

// Basic variants
export const Default: Story = {
  args: {
    'aria-label': 'Toggle switch',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane" />
      <Label htmlFor="airplane" className="cursor-pointer">
        Airplane mode
      </Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Switch with Label for accessibility. Use cursor-pointer on Label for better UX. This creates a 44x44px clickable area.',
      },
    },
  },
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="checked" defaultChecked />
      <Label htmlFor="checked" className="cursor-pointer">
        Enabled by default
      </Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="disabled" disabled />
      <Label htmlFor="disabled">Disabled switch</Label>
    </div>
  ),
};

export const DisabledChecked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="disabled-checked" disabled checked />
      <Label htmlFor="disabled-checked">Disabled and checked</Label>
    </div>
  ),
};

// Multiple switches
export const SwitchGroup: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch id="wifi" defaultChecked />
        <Label htmlFor="wifi" className="cursor-pointer">
          Wi-Fi
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="bluetooth" />
        <Label htmlFor="bluetooth" className="cursor-pointer">
          Bluetooth
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="location" defaultChecked />
        <Label htmlFor="location" className="cursor-pointer">
          Location Services
        </Label>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple switches with consistent spacing (space-y-4 = 16px).',
      },
    },
  },
};

// With description
export const WithDescription: Story = {
  render: () => (
    <div className="flex items-start justify-between space-x-2">
      <div className="grid gap-2.5 leading-none">
        <Label htmlFor="notifications" className="cursor-pointer">
          Push notifications
        </Label>
        <p className="text-sm text-muted-foreground">
          Receive notifications about new messages and updates.
        </p>
      </div>
      <Switch id="notifications" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Switch with label and description. Use justify-between for right alignment.',
      },
    },
  },
};

// Settings list pattern
export const SettingsList: Story = {
  render: () => (
    <div className="divide-y">
      <div className="flex items-center justify-between py-4">
        <div className="space-y-0.5">
          <Label htmlFor="s1" className="cursor-pointer">
            Email notifications
          </Label>
          <p className="text-sm text-muted-foreground">Receive email about your account activity.</p>
        </div>
        <Switch id="s1" defaultChecked />
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="space-y-0.5">
          <Label htmlFor="s2" className="cursor-pointer">
            Marketing emails
          </Label>
          <p className="text-sm text-muted-foreground">
            Receive emails about new products and features.
          </p>
        </div>
        <Switch id="s2" />
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="space-y-0.5">
          <Label htmlFor="s3" className="cursor-pointer">
            Security alerts
          </Label>
          <p className="text-sm text-muted-foreground">Get notified about important security events.</p>
        </div>
        <Switch id="s3" defaultChecked />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Settings list with dividers. Common pattern in settings pages.',
      },
    },
  },
};

// Form example
export const NotificationSettings: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-medium">Notification Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notif" className="cursor-pointer">
                Email notifications
              </Label>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch id="email-notif" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notif" className="cursor-pointer">
                Push notifications
              </Label>
              <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
            </div>
            <Switch id="push-notif" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-notif" className="cursor-pointer">
                SMS notifications
              </Label>
              <p className="text-sm text-muted-foreground">Receive text messages for critical alerts</p>
            </div>
            <Switch id="sms-notif" defaultChecked />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete notification settings form with grouped switches.',
      },
    },
  },
};
