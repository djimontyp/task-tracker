import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { TopicsSmartFilters } from './TopicsSmartFilters';
import type { TopicFilterMode } from './useTopicFilterParams';

/**
 * TopicsSmartFilters provides tab-based topic filtering with count badges.
 *
 * ## Features
 * - Three filter modes: All, Active, Archived
 * - Real-time count badges for each category
 * - URL-synced filter state via useTopicFilterParams hook
 * - WCAG AA compliant with proper aria-labels
 * - Touch-friendly 44px targets
 *
 * ## Design System Rules
 * - Semantic colors: `bg-status-connected/10`, `text-status-connected` for active
 * - Muted colors for archived topics
 * - 4px grid spacing: `gap-0.5`, `h-11`, `px-4`
 * - Touch targets: All tabs are 44px height (h-11)
 * - Icons: FolderOpen for active, Archive for archived
 */
const meta: Meta<typeof TopicsSmartFilters> = {
  title: 'Features/Topics/TopicsSmartFilters',
  component: TopicsSmartFilters,
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
          'Tab-based filter component for Topics page. Shows All/Active/Archived tabs with count badges.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TopicsSmartFilters>;

export const Default: Story = {
  args: {
    counts: {
      all: 24,
      active: 18,
      archived: 6,
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

export const ActiveTabSelected: Story = {
  args: {
    counts: {
      all: 24,
      active: 18,
      archived: 6,
    },
    activeFilter: 'active',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Active tab selected - shows only active topics',
      },
    },
  },
};

export const ArchivedTabSelected: Story = {
  args: {
    counts: {
      all: 24,
      active: 18,
      archived: 6,
    },
    activeFilter: 'archived',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Archived tab selected - shows only archived topics',
      },
    },
  },
};

export const EmptyState: Story = {
  args: {
    counts: {
      all: 0,
      active: 0,
      archived: 0,
    },
    activeFilter: 'all',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no topics exist',
      },
    },
  },
};

export const MostlyActive: Story = {
  args: {
    counts: {
      all: 50,
      active: 48,
      archived: 2,
    },
    activeFilter: 'all',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Most topics are active (96%)',
      },
    },
  },
};

export const ManyArchived: Story = {
  args: {
    counts: {
      all: 100,
      active: 20,
      archived: 80,
    },
    activeFilter: 'all',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Many archived topics (80%)',
      },
    },
  },
};

export const LargeCounts: Story = {
  args: {
    counts: {
      all: 1234,
      active: 987,
      archived: 247,
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
    const [activeFilter, setActiveFilter] = useState<TopicFilterMode>('all');

    return (
      <div className="space-y-4">
        <TopicsSmartFilters
          counts={{
            all: 24,
            active: 18,
            archived: 6,
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
      all: 24,
      active: 18,
      archived: 6,
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
      all: 24,
      active: 18,
      archived: 6,
    },
    activeFilter: 'active',
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
