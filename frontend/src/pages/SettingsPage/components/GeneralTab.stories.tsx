import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider } from '@/shared/components/ThemeProvider';
import { Toaster } from '@/shared/ui/sonner';
import GeneralTab from './GeneralTab';

/**
 * GeneralTab contains settings for:
 * - Interface language (Ukrainian/English)
 * - Theme appearance (Light/Dark/System)
 * - Administrator mode toggle
 *
 * ## i18n Integration
 * - Language selector syncs with i18next for instant UI updates
 * - Persists preference to localStorage via Zustand
 * - Debounced backend sync for cross-device persistence
 *
 * ## Design System
 * - Uses Card pattern with CardHeader/CardContent
 * - RadioGroup for mutually exclusive choices
 * - Switch for toggle states
 * - Follows 4px spacing grid
 */
const meta: Meta<typeof GeneralTab> = {
  title: 'Pages/Settings/GeneralTab',
  component: GeneralTab,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
        <Toaster />
      </ThemeProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Settings tab for language, theme, and admin mode configuration. Part of the SettingsPage plugin architecture.',
      },
    },
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof GeneralTab>;

/**
 * Default state with Ukrainian language selected.
 * Shows all three settings cards: Language, Appearance, Admin.
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default view with Ukrainian language. All settings cards visible.',
      },
    },
  },
};

/**
 * Narrow container simulating mobile viewport.
 * Cards stack vertically with full width.
 */
export const MobileView: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <ThemeProvider>
          <Story />
          <Toaster />
        </ThemeProvider>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Mobile viewport showing responsive card layout.',
      },
    },
    viewport: {
      defaultViewport: 'xs',
    },
  },
};

/**
 * Wide container simulating desktop viewport.
 */
export const DesktopView: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <ThemeProvider>
          <Story />
          <Toaster />
        </ThemeProvider>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Desktop viewport with comfortable reading width.',
      },
    },
    viewport: {
      defaultViewport: 'lg',
    },
  },
};

/**
 * Interactive example - change language and see UI update instantly.
 *
 * Note: Language changes persist to Zustand store and trigger
 * i18next locale switch for immediate UI translation.
 */
export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo - click language options to see instant UI translation. Theme changes apply to entire Storybook.',
      },
    },
  },
};
