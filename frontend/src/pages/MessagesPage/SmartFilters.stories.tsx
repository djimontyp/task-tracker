import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SmartFilters } from './SmartFilters';

/**
 * SmartFilters provides tab-based message filtering with count badges.
 *
 * ## Features
 * - Three filter modes: All, Signals, Noise
 * - Real-time count badges for each category
 * - URL-synced filter state via useFilterParams hook
 * - WCAG AA compliant with proper aria-labels
 * - Touch-friendly 44px targets
 *
 * ## Design System Rules
 * - Semantic colors: `bg-status-connected/10`, `text-status-connected` for signals
 * - 4px grid spacing: `gap-1`, `gap-2`, `h-11`, `px-4`
 * - Touch targets: All tabs are 44px height (h-11)
 * - Accessibility: TabsList with aria-label, TabsTrigger with dynamic aria-labels
 */
const meta: Meta<typeof SmartFilters> = {
  title: 'Features/Messages/SmartFilters',
  component: SmartFilters,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Tab-based filter component for Messages page. Shows All/Signals/Noise tabs with count badges. Replaces the previous toggle button + ratio badge UI.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SmartFilters>;

export const Default: Story = {
  args: {
    counts: {
      all: 124,
      signals: 47,
      noise: 77,
    },
    activeFilter: 'all',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state with "All" tab selected',
      },
    },
  },
};

export const SignalsActive: Story = {
  args: {
    counts: {
      all: 124,
      signals: 47,
      noise: 77,
    },
    activeFilter: 'signals',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Signals tab selected - shows only signal messages',
      },
    },
  },
};

export const NoiseActive: Story = {
  args: {
    counts: {
      all: 124,
      signals: 47,
      noise: 77,
    },
    activeFilter: 'noise',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Noise tab selected - shows only noise messages',
      },
    },
  },
};

export const EmptyState: Story = {
  args: {
    counts: {
      all: 0,
      signals: 0,
      noise: 0,
    },
    activeFilter: 'all',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no messages exist',
      },
    },
  },
};

export const HighSignalRatio: Story = {
  args: {
    counts: {
      all: 100,
      signals: 95,
      noise: 5,
    },
    activeFilter: 'all',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'High signal ratio (95%) - most messages are signals',
      },
    },
  },
};

export const HighNoiseRatio: Story = {
  args: {
    counts: {
      all: 100,
      signals: 10,
      noise: 90,
    },
    activeFilter: 'all',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'High noise ratio (90%) - most messages are noise',
      },
    },
  },
};

export const LargeCounts: Story = {
  args: {
    counts: {
      all: 12453,
      signals: 4782,
      noise: 7671,
    },
    activeFilter: 'all',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Large counts - verifies badge displays large numbers correctly',
      },
    },
  },
};

/**
 * Interactive story demonstrating tab switching behavior
 */
export const Interactive: Story = {
  render: function InteractiveStory() {
    const [activeFilter, setActiveFilter] = useState<'all' | 'signals' | 'noise'>('all');

    return (
      <div className="space-y-4">
        <SmartFilters
          counts={{
            all: 124,
            signals: 47,
            noise: 77,
          }}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <div className="text-sm text-muted-foreground">
          Current filter: <code className="bg-muted px-1 rounded">{activeFilter}</code>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo - click tabs to see filter state changes',
      },
    },
  },
};

export const MobileView: Story = {
  args: {
    counts: {
      all: 124,
      signals: 47,
      noise: 77,
    },
    activeFilter: 'all',
    onFilterChange: () => {},
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile viewport (375px) - tabs should remain touch-friendly',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    counts: {
      all: 124,
      signals: 47,
      noise: 77,
    },
    activeFilter: 'signals',
    onFilterChange: () => {},
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Dark mode - semantic tokens adapt to theme',
      },
    },
  },
};
