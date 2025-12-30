import type { Meta, StoryObj } from '@storybook/react-vite';
import { UniversalThemeIcon } from './ThemeIcons';

const meta: Meta<typeof UniversalThemeIcon> = {
  title: 'Components/Icons/ThemeIcons',
  component: UniversalThemeIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Universal theme icon that changes appearance based on theme mode. Light shows outline circle, Dark shows filled circle, System shows half-filled.',
      },
    },
  },
  argTypes: {
    theme: {
      control: 'select',
      options: ['light', 'dark', 'system'],
      description: 'Theme mode to display',
    },
    className: {
      control: 'text',
      description: 'Size and additional CSS classes (default: size-5)',
      table: {
        defaultValue: { summary: 'size-5' },
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof UniversalThemeIcon>;

export const Light: Story = {
  args: {
    theme: 'light',
  },
  parameters: {
    docs: {
      description: {
        story: 'Light theme icon - outline circle with info color.',
      },
    },
  },
};

export const Dark: Story = {
  args: {
    theme: 'dark',
  },
  parameters: {
    docs: {
      description: {
        story: 'Dark theme icon - filled circle with foreground color.',
      },
    },
  },
};

export const System: Story = {
  args: {
    theme: 'system',
  },
  parameters: {
    docs: {
      description: {
        story: 'System theme icon - half-filled circle representing auto mode.',
      },
    },
  },
};

export const AllThemes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <UniversalThemeIcon theme="light" className="size-8" />
        <span className="text-sm text-muted-foreground">Light</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <UniversalThemeIcon theme="dark" className="size-8" />
        <span className="text-sm text-muted-foreground">Dark</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <UniversalThemeIcon theme="system" className="size-8" />
        <span className="text-sm text-muted-foreground">System</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All theme icons side by side for comparison.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <div className="flex flex-col items-center gap-2">
        <UniversalThemeIcon theme="system" className="size-4" />
        <span className="text-xs text-muted-foreground">16px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <UniversalThemeIcon theme="system" className="size-5" />
        <span className="text-xs text-muted-foreground">20px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <UniversalThemeIcon theme="system" className="size-6" />
        <span className="text-xs text-muted-foreground">24px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <UniversalThemeIcon theme="system" className="size-8" />
        <span className="text-xs text-muted-foreground">32px</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Theme icon at different sizes using Tailwind size classes.',
      },
    },
  },
};

export const InToggleButton: Story = {
  render: () => (
    <div className="flex gap-1 p-1 rounded-lg bg-muted">
      <button className="flex items-center justify-center p-2 rounded-md hover:bg-background">
        <UniversalThemeIcon theme="light" className="size-4" />
      </button>
      <button className="flex items-center justify-center p-2 rounded-md bg-background shadow-sm">
        <UniversalThemeIcon theme="system" className="size-4" />
      </button>
      <button className="flex items-center justify-center p-2 rounded-md hover:bg-background">
        <UniversalThemeIcon theme="dark" className="size-4" />
      </button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Theme icons in a toggle button group (common UI pattern).',
      },
    },
  },
};

export const InSettingsRow: Story = {
  render: () => (
    <div className="flex items-center justify-between p-4 rounded-lg border max-w-sm">
      <div className="flex items-center gap-3">
        <UniversalThemeIcon theme="system" className="size-5" />
        <div>
          <div className="font-medium">Theme</div>
          <div className="text-sm text-muted-foreground">System preference</div>
        </div>
      </div>
      <button className="text-sm text-primary hover:underline">Change</button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Theme icon in a settings row layout.',
      },
    },
  },
};
