import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { Settings, Bell, Sun, Moon, Trash2, HelpCircle, Search, Menu } from 'lucide-react';
import { TooltipIconButton } from './index';

/**
 * TooltipIconButton - A reusable icon button with tooltip.
 *
 * Provides:
 * - Consistent 44px touch targets (WCAG 2.5.5 compliant)
 * - Built-in tooltip support
 * - Can render as button or link
 * - Proper accessibility with aria-labels
 * - **Borderless ghost variant** with subtle hover states
 */

const meta: Meta<typeof TooltipIconButton> = {
  title: 'Patterns/TooltipIconButton',
  component: TooltipIconButton,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="flex items-center gap-4 p-8">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
## TooltipIconButton

A standardized icon button component with built-in tooltip support.

### Features
- **44px touch target**: WCAG 2.5.5 compliant minimum touch size
- **Tooltip on hover**: Shows descriptive text on mouse hover
- **Link support**: Can render as \`<Link>\` when \`href\` is provided
- **Accessible**: Includes \`aria-label\` for screen readers

### Usage

\`\`\`tsx
// As a button
<TooltipIconButton
  icon={<Settings className="h-5 w-5" />}
  label="Open settings"
  tooltip="Settings"
  onClick={() => openSettings()}
/>

// As a link
<TooltipIconButton
  icon={<Settings className="h-5 w-5" />}
  label="Go to settings"
  tooltip="Settings"
  href="/settings"
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'ghost', 'outline'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TooltipIconButton>;

/**
 * Default button with Settings icon.
 */
export const Default: Story = {
  args: {
    icon: <Settings className="h-5 w-5" />,
    label: 'Open settings',
    tooltip: 'Settings',
    onClick: () => console.log('Settings clicked'),
  },
};

/**
 * Button with tooltip shown on hover.
 */
export const WithTooltip: Story = {
  args: {
    icon: <Bell className="h-5 w-5" />,
    label: 'Toggle notifications',
    tooltip: 'View and manage notifications',
    onClick: () => console.log('Notifications clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Hover over the button to see the tooltip appear.',
      },
    },
  },
};

/**
 * Rendered as a link instead of a button.
 */
export const AsLink: Story = {
  args: {
    icon: <Settings className="h-5 w-5" />,
    label: 'Go to settings page',
    tooltip: 'Settings',
    href: '/settings',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `href` is provided, the component renders as a `<Link>` instead of a `<Button>`.',
      },
    },
  },
};

/**
 * Multiple icon buttons in a row (common navbar pattern).
 */
export const MultipleButtons: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <TooltipIconButton
        icon={<Sun className="h-5 w-5" />}
        label="Toggle theme"
        tooltip="Light theme"
        onClick={() => console.log('Theme toggled')}
      />
      <TooltipIconButton
        icon={<Bell className="h-5 w-5" />}
        label="View notifications"
        tooltip="Notifications"
        onClick={() => console.log('Notifications')}
      />
      <TooltipIconButton
        icon={<Settings className="h-5 w-5" />}
        label="Open settings"
        tooltip="Settings"
        href="/settings"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common pattern for navbar icon buttons grouped together.',
      },
    },
  },
};

/**
 * Disabled state.
 */
export const Disabled: Story = {
  args: {
    icon: <Trash2 className="h-5 w-5" />,
    label: 'Delete item',
    tooltip: 'Delete is disabled',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled buttons are not interactive and appear dimmed.',
      },
    },
  },
};

/**
 * Destructive action variant with custom styling.
 */
export const DestructiveAction: Story = {
  args: {
    icon: <Trash2 className="h-5 w-5" />,
    label: 'Delete permanently',
    tooltip: 'Delete this item permanently',
    onClick: () => console.log('Delete clicked'),
    className: 'text-destructive hover:text-destructive hover:bg-destructive/10',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom styling can be applied for destructive actions.',
      },
    },
  },
};

/**
 * Navbar action buttons pattern (as used in the Navbar component).
 * Shows the borderless ghost variant with consistent hover states.
 */
export const NavbarActions: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-4 bg-card rounded-lg shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
      <TooltipIconButton
        icon={<HelpCircle className="h-4 w-4" />}
        label="Page info"
        tooltip="Dashboard - Your workspace overview"
        onClick={() => console.log('Help clicked')}
      />
      <TooltipIconButton
        icon={<Sun className="h-5 w-5" />}
        label="Toggle theme"
        tooltip="Light theme"
        onClick={() => console.log('Theme toggled')}
      />
      <TooltipIconButton
        icon={<Settings className="h-5 w-5" />}
        label="Open settings"
        tooltip="Settings"
        href="/settings"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Navbar action buttons pattern showing ghost variant with borderless design. Uses shadow-sm for separation instead of borders.',
      },
    },
  },
};

/**
 * Mobile navbar pattern with hamburger and search.
 */
export const MobileNavbarButtons: Story = {
  render: () => (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
      <TooltipIconButton
        icon={<Menu className="h-5 w-5" />}
        label="Toggle sidebar"
        tooltip="Open menu"
        onClick={() => console.log('Menu clicked')}
      />
      <div className="flex items-center gap-2">
        <TooltipIconButton
          icon={<Search className="h-5 w-5" />}
          label="Open search"
          tooltip="Search"
          onClick={() => console.log('Search clicked')}
        />
        <TooltipIconButton
          icon={<Moon className="h-5 w-5" />}
          label="Toggle theme"
          tooltip="Dark theme"
          onClick={() => console.log('Theme toggled')}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Mobile navbar button layout pattern. Hamburger on left, actions on right.',
      },
    },
  },
};

/**
 * Ghost buttons in dark mode.
 */
export const DarkModeButtons: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-4 bg-slate-900 rounded-lg">
      <TooltipIconButton
        icon={<HelpCircle className="h-4 w-4" />}
        label="Page info"
        tooltip="Dashboard info"
        onClick={() => console.log('Help clicked')}
      />
      <TooltipIconButton
        icon={<Moon className="h-5 w-5" />}
        label="Toggle theme"
        tooltip="Dark theme active"
        onClick={() => console.log('Theme toggled')}
      />
      <TooltipIconButton
        icon={<Settings className="h-5 w-5" />}
        label="Open settings"
        tooltip="Settings"
        href="/settings"
      />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Ghost buttons in dark mode showing hover state visibility.',
      },
    },
  },
};
