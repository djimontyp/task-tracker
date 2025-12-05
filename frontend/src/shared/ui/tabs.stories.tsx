import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileText, Settings, User } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

/**
 * Tabs component for navigation between content sections.
 *
 * ## Design System Rules
 * - Active tab must be visually distinct with background and shadow
 * - Keyboard navigation: Arrow keys move between tabs, Tab key focuses trigger
 * - Touch targets: TabsTrigger has adequate height (36px) for mobile interaction
 * - Focus visible: Ring offset follows design system focus patterns
 */
const meta: Meta<typeof Tabs> = {
  title: 'UI/Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Accessible tabs component built on Radix UI. Supports keyboard navigation (arrow keys) and follows WCAG 2.1 AA guidelines.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

// Basic tabs
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <div className="p-4 border rounded-md">
          <h3 className="font-semibold mb-2">Account Settings</h3>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="password">
        <div className="p-4 border rounded-md">
          <h3 className="font-semibold mb-2">Password Security</h3>
          <p className="text-sm text-muted-foreground">
            Change your password and manage security options.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="notifications">
        <div className="p-4 border rounded-md">
          <h3 className="font-semibold mb-2">Notification Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Control how and when you receive notifications.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Basic tabs with text content. Use arrow keys to navigate between tabs.',
      },
    },
  },
};

// Tabs with icons
export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="profile" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="profile" className="gap-2">
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="documents" className="gap-2">
          <FileText className="h-4 w-4" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <div className="p-4 border rounded-md">User profile information</div>
      </TabsContent>
      <TabsContent value="documents">
        <div className="p-4 border rounded-md">Your documents and files</div>
      </TabsContent>
      <TabsContent value="settings">
        <div className="p-4 border rounded-md">Application settings</div>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tabs with icons for better visual identification.',
      },
    },
  },
};

// Full width tabs
export const FullWidth: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="p-4 border rounded-md">Dashboard overview content</div>
      </TabsContent>
      <TabsContent value="analytics">
        <div className="p-4 border rounded-md">Analytics charts and metrics</div>
      </TabsContent>
      <TabsContent value="reports">
        <div className="p-4 border rounded-md">Generated reports list</div>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Full-width tabs using CSS grid. Triggers expand to fill equal space.',
      },
    },
  },
};

// Vertical tabs (mobile-friendly)
export const VerticalLayout: Story = {
  render: () => (
    <Tabs defaultValue="general" className="flex flex-col sm:flex-row gap-4 w-full">
      <TabsList className="flex flex-row sm:flex-col h-auto sm:h-full w-full sm:w-[200px]">
        <TabsTrigger value="general" className="justify-start">
          General
        </TabsTrigger>
        <TabsTrigger value="security" className="justify-start">
          Security
        </TabsTrigger>
        <TabsTrigger value="privacy" className="justify-start">
          Privacy
        </TabsTrigger>
        <TabsTrigger value="advanced" className="justify-start">
          Advanced
        </TabsTrigger>
      </TabsList>
      <div className="flex-1">
        <TabsContent value="general">
          <div className="p-4 border rounded-md">General settings panel</div>
        </TabsContent>
        <TabsContent value="security">
          <div className="p-4 border rounded-md">Security settings panel</div>
        </TabsContent>
        <TabsContent value="privacy">
          <div className="p-4 border rounded-md">Privacy settings panel</div>
        </TabsContent>
        <TabsContent value="advanced">
          <div className="p-4 border rounded-md">Advanced settings panel</div>
        </TabsContent>
      </div>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Responsive layout: horizontal tabs on mobile, vertical on desktop (sm breakpoint).',
      },
    },
  },
};

// Disabled tab
export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="enabled" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="enabled">Enabled</TabsTrigger>
        <TabsTrigger value="disabled" disabled>
          Disabled
        </TabsTrigger>
        <TabsTrigger value="another">Another</TabsTrigger>
      </TabsList>
      <TabsContent value="enabled">
        <div className="p-4 border rounded-md">Active content</div>
      </TabsContent>
      <TabsContent value="disabled">
        <div className="p-4 border rounded-md">Disabled content</div>
      </TabsContent>
      <TabsContent value="another">
        <div className="p-4 border rounded-md">Another content</div>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tabs can be disabled to prevent interaction.',
      },
    },
  },
};

// Real-world example: Settings panel
export const SettingsPanel: Story = {
  render: () => (
    <Tabs defaultValue="profile" className="w-full max-w-[600px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Display Name</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-md"
            placeholder="Enter your name"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Bio</label>
          <textarea
            className="w-full px-4 py-2 border rounded-md"
            placeholder="Tell us about yourself"
            rows={3}
          />
        </div>
      </TabsContent>
      <TabsContent value="account" className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded-md"
            placeholder="your@email.com"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-md"
            placeholder="••••••••"
          />
        </div>
      </TabsContent>
      <TabsContent value="notifications" className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Email notifications</label>
          <input type="checkbox" />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Push notifications</label>
          <input type="checkbox" />
        </div>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world settings panel with form inputs across multiple tabs.',
      },
    },
  },
};
