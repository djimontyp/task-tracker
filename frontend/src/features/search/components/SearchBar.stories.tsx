import type { Meta, StoryObj } from '@storybook/react-vite';
import { BrowserRouter } from 'react-router-dom';
import { SearchBar } from './SearchBar';

const meta: Meta<typeof SearchBar> = {
  title: 'Features/Search/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Global search input with keyboard shortcut (/) support. Searches topics and messages with 300ms debounce. Navigates to search results page when query is 2+ characters.',
      },
    },
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="w-80 p-4">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

/**
 * Default empty state - ready for user input
 */
export const Default: Story = {};

/**
 * Empty state with focus hint
 */
export const WithFocusHint: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Search bar with placeholder showing keyboard shortcut hint (press "/" to focus)',
      },
    },
  },
};

/**
 * Accessibility features
 */
export const Accessibility: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Search bar with accessible features: aria-label, keyboard shortcut (/) support, icon with pointer-events-none',
      },
    },
  },
};

/**
 * Mobile responsive view
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Search bar adapts to mobile viewports with reduced width (w-64 = 16rem)',
      },
    },
  },
};

/**
 * Dark mode variant
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Search bar in dark mode using semantic tokens (text-muted-foreground)',
      },
    },
  },
};
