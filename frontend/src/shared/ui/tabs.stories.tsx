import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileText, Settings, User, Signal, Volume2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { Badge } from './badge';

/**
 * Tabs component for navigation between content sections.
 *
 * ## Variants
 * - **default (underline)**: Minimalist tabs with animated underline indicator. Best for navigation.
 * - **pill**: Compact pill-style tabs with background. Best for filters and toggles.
 *
 * ## Design System Rules
 * - Active tab uses primary color (teal) for indicator
 * - Animated underline with 200ms ease-out transition
 * - Keyboard navigation: Arrow keys move between tabs
 * - Touch targets: Adequate height (40px+) for mobile interaction
 */
const meta: Meta<typeof Tabs> = {
  title: 'Primitives/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Accessible tabs component with two variants: underline (default) for navigation and pill for filters. Built on Radix UI.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

/**
 * Default underline tabs - best for navigation between sections.
 * Features animated teal underline indicator on active tab.
 */
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="sources">Sources</TabsTrigger>
        <TabsTrigger value="providers">Providers</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <div className="p-4 border rounded-md">
          <h3 className="font-semibold mb-2">General Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure your general application preferences.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="sources">
        <div className="p-4 border rounded-md">
          <h3 className="font-semibold mb-2">Data Sources</h3>
          <p className="text-sm text-muted-foreground">
            Manage your connected data sources like Telegram.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="providers">
        <div className="p-4 border rounded-md">
          <h3 className="font-semibold mb-2">LLM Providers</h3>
          <p className="text-sm text-muted-foreground">
            Configure AI providers for knowledge extraction.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default underline tabs with animated indicator. Use for navigation between content sections.',
      },
    },
  },
};

/**
 * Pill variant - compact tabs best for filters and toggles.
 * Uses muted background with shadow on active state.
 */
export const PillVariant: Story = {
  render: () => (
    <Tabs defaultValue="all" className="w-[500px]">
      <TabsList variant="pill">
        <TabsTrigger variant="pill" value="all" className="gap-2 px-4">
          All
          <Badge variant="secondary">128</Badge>
        </TabsTrigger>
        <TabsTrigger variant="pill" value="signals" className="gap-2 px-4">
          <Signal className="h-4 w-4" />
          Signals
          <Badge variant="outline" className="border-status-connected text-status-connected">42</Badge>
        </TabsTrigger>
        <TabsTrigger variant="pill" value="noise" className="gap-2 px-4">
          <Volume2 className="h-4 w-4" />
          Noise
          <Badge variant="outline" className="text-muted-foreground">86</Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <div className="p-4 border rounded-md">All messages view</div>
      </TabsContent>
      <TabsContent value="signals">
        <div className="p-4 border rounded-md">Important signals only</div>
      </TabsContent>
      <TabsContent value="noise">
        <div className="p-4 border rounded-md">Noise messages</div>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pill variant with badges for filter counts. Use for filtering data views.',
      },
    },
  },
};

/**
 * Underline tabs with icons for better visual identification.
 */
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
        story: 'Underline tabs with icons for better visual identification.',
      },
    },
  },
};

/**
 * Full-width pill tabs using CSS grid.
 */
export const FullWidthPill: Story = {
  render: () => (
    <Tabs defaultValue="period" className="w-full max-w-[400px]">
      <TabsList variant="pill" className="grid w-full grid-cols-2">
        <TabsTrigger variant="pill" value="period">By Period</TabsTrigger>
        <TabsTrigger variant="pill" value="messages">By Messages</TabsTrigger>
      </TabsList>
      <TabsContent value="period">
        <div className="p-4 border rounded-md">Select time period for extraction</div>
      </TabsContent>
      <TabsContent value="messages">
        <div className="p-4 border rounded-md">Select specific messages</div>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full-width pill tabs using CSS grid. Triggers expand to fill equal space.',
      },
    },
  },
};

/**
 * Pill variant vertical layout (responsive).
 */
export const VerticalPill: Story = {
  render: () => (
    <Tabs defaultValue="general" className="flex flex-col sm:flex-row gap-4 w-full">
      <TabsList variant="pill" className="flex flex-row sm:flex-col h-auto sm:h-full w-full sm:w-[200px]">
        <TabsTrigger variant="pill" value="general" className="justify-start">
          General
        </TabsTrigger>
        <TabsTrigger variant="pill" value="security" className="justify-start">
          Security
        </TabsTrigger>
        <TabsTrigger variant="pill" value="privacy" className="justify-start">
          Privacy
        </TabsTrigger>
        <TabsTrigger variant="pill" value="advanced" className="justify-start">
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
        story: 'Responsive vertical layout: horizontal on mobile, vertical on desktop.',
      },
    },
  },
};

/**
 * Disabled tab state.
 */
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

/**
 * Real-world: Settings page navigation (underline).
 */
export const SettingsNavigation: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-full max-w-[600px]">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="sources">Sources</TabsTrigger>
        <TabsTrigger value="providers">Providers</TabsTrigger>
        <TabsTrigger value="prompts">Prompt Tuning</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Application Name</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-md"
            placeholder="Pulse Radar"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Timezone</label>
          <select className="w-full px-4 py-2 border rounded-md">
            <option>UTC</option>
            <option>Europe/Kyiv</option>
          </select>
        </div>
      </TabsContent>
      <TabsContent value="sources" className="space-y-4">
        <div className="p-4 border rounded-md">
          <h4 className="font-medium mb-2">Telegram</h4>
          <p className="text-sm text-muted-foreground">Configure your Telegram bot integration</p>
        </div>
      </TabsContent>
      <TabsContent value="providers" className="space-y-4">
        <div className="p-4 border rounded-md">
          <h4 className="font-medium mb-2">LLM Providers</h4>
          <p className="text-sm text-muted-foreground">Manage AI model providers</p>
        </div>
      </TabsContent>
      <TabsContent value="prompts" className="space-y-4">
        <div className="p-4 border rounded-md">
          <h4 className="font-medium mb-2">Prompt Engineering</h4>
          <p className="text-sm text-muted-foreground">Fine-tune extraction prompts</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world settings navigation using underline tabs.',
      },
    },
  },
};

/**
 * Side-by-side comparison of both variants.
 */
export const VariantComparison: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-4 text-muted-foreground">Underline (default) - Navigation</h3>
        <Tabs defaultValue="tab1" className="w-[400px]">
          <TabsList>
            <TabsTrigger value="tab1">First Tab</TabsTrigger>
            <TabsTrigger value="tab2">Second Tab</TabsTrigger>
            <TabsTrigger value="tab3">Third Tab</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4 text-muted-foreground">Pill - Filters</h3>
        <Tabs defaultValue="tab1" className="w-[400px]">
          <TabsList variant="pill">
            <TabsTrigger variant="pill" value="tab1">First Tab</TabsTrigger>
            <TabsTrigger variant="pill" value="tab2">Second Tab</TabsTrigger>
            <TabsTrigger variant="pill" value="tab3">Third Tab</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of underline and pill variants.',
      },
    },
  },
};
