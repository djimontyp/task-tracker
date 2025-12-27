import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AtomsSmartFilters } from './AtomsSmartFilters';
import type { AtomStatusFilter } from './useAtomFilterParams';

/**
 * AtomsSmartFilters provides tab-based atom filtering with count badges.
 *
 * ## Features
 * - Four filter modes: All, Pending, Approved, Rejected
 * - Real-time count badges for each category
 * - URL-synced filter state via useAtomFilterParams hook
 * - WCAG AA compliant with proper aria-labels
 * - Touch-friendly 44px targets
 *
 * ## Design System Rules
 * - Semantic colors:
 *   - Pending: `semantic-warning`
 *   - Approved: `status-connected`
 *   - Rejected: `destructive`
 * - 4px grid spacing: `gap-0.5`, `h-11`, `px-4`
 * - Touch targets: All tabs are 44px height (h-11)
 * - Icons: Inbox for pending, CheckCircle for approved, XCircle for rejected
 */
const meta: Meta<typeof AtomsSmartFilters> = {
  title: 'Features/Atoms/AtomsSmartFilters',
  component: AtomsSmartFilters,
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
          'Tab-based filter component for Atoms page. Shows All/Pending/Approved/Rejected tabs with count badges and semantic colors.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AtomsSmartFilters>;

export const Default: Story = {
  args: {
    counts: {
      all: 45,
      pending: 12,
      approved: 28,
      rejected: 5,
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

export const PendingTabSelected: Story = {
  args: {
    counts: {
      all: 45,
      pending: 12,
      approved: 28,
      rejected: 5,
    },
    activeFilter: 'pending',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Pending tab selected - shows atoms awaiting review',
      },
    },
  },
};

export const ApprovedTabSelected: Story = {
  args: {
    counts: {
      all: 45,
      pending: 12,
      approved: 28,
      rejected: 5,
    },
    activeFilter: 'approved',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Approved tab selected - shows accepted atoms',
      },
    },
  },
};

export const RejectedTabSelected: Story = {
  args: {
    counts: {
      all: 45,
      pending: 12,
      approved: 28,
      rejected: 5,
    },
    activeFilter: 'rejected',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Rejected tab selected - shows archived/rejected atoms',
      },
    },
  },
};

export const EmptyState: Story = {
  args: {
    counts: {
      all: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    },
    activeFilter: 'all',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no atoms exist',
      },
    },
  },
};

export const HighPendingCount: Story = {
  args: {
    counts: {
      all: 100,
      pending: 75,
      approved: 20,
      rejected: 5,
    },
    activeFilter: 'all',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Many pending atoms requiring review (75%)',
      },
    },
  },
};

export const MostlyApproved: Story = {
  args: {
    counts: {
      all: 200,
      pending: 5,
      approved: 185,
      rejected: 10,
    },
    activeFilter: 'all',
    onFilterChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Most atoms are approved (92.5%)',
      },
    },
  },
};

export const LargeCounts: Story = {
  args: {
    counts: {
      all: 5432,
      pending: 1234,
      approved: 3876,
      rejected: 322,
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
    const [activeFilter, setActiveFilter] = useState<AtomStatusFilter>('all');

    return (
      <div className="space-y-4">
        <AtomsSmartFilters
          counts={{
            all: 45,
            pending: 12,
            approved: 28,
            rejected: 5,
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
      all: 45,
      pending: 12,
      approved: 28,
      rejected: 5,
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
        story: 'Mobile viewport (375px) - tabs may scroll horizontally',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    counts: {
      all: 45,
      pending: 12,
      approved: 28,
      rejected: 5,
    },
    activeFilter: 'approved',
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
