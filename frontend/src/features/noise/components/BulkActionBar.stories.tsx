import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { BulkActionBar, BulkActionBarSpacer, useBulkSelection } from './BulkActionBar';
import { MessageCard, type MessageData } from './SignalNoiseCard';

const meta: Meta<typeof BulkActionBar> = {
  title: 'Features/Noise/BulkActionBar',
  component: BulkActionBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Sticky bottom bar for bulk review actions.

**Features:**
- Fixed to bottom of viewport
- Slides up when items selected
- Shows selection count
- Clear, Reject, Approve actions
- Loading states for async operations
- Touch-friendly (44px targets)

**Includes hook:** \`useBulkSelection\` for managing selection state.
        `,
      },
    },
  },
  argTypes: {
    selectedCount: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Number of selected items',
    },
    totalCount: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Total available items',
    },
    isApproving: {
      control: 'boolean',
      description: 'Loading state for approve action',
    },
    isRejecting: {
      control: 'boolean',
      description: 'Loading state for reject action',
    },
  },
};

export default meta;
type Story = StoryObj<typeof BulkActionBar>;

// Default story
export const Default: Story = {
  args: {
    selectedCount: 5,
    totalCount: 25,
    onClearSelection: () => console.log('Clear selection'),
    onApproveSelected: () => console.log('Approve selected'),
    onRejectSelected: () => console.log('Reject selected'),
  },
};

// Hidden state (no selection)
export const Hidden: Story = {
  args: {
    selectedCount: 0,
    totalCount: 25,
    onClearSelection: () => {},
    onApproveSelected: () => {},
    onRejectSelected: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Bar is hidden when no items are selected.',
      },
    },
  },
};

// Loading states
export const Approving: Story = {
  args: {
    selectedCount: 3,
    totalCount: 10,
    isApproving: true,
    onClearSelection: () => {},
    onApproveSelected: () => {},
    onRejectSelected: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Approve button shows loading spinner, all actions disabled.',
      },
    },
  },
};

export const Rejecting: Story = {
  args: {
    selectedCount: 3,
    totalCount: 10,
    isRejecting: true,
    onClearSelection: () => {},
    onApproveSelected: () => {},
    onRejectSelected: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Reject button shows loading spinner, all actions disabled.',
      },
    },
  },
};

// Large selection
export const LargeSelection: Story = {
  args: {
    selectedCount: 47,
    totalCount: 100,
    onClearSelection: () => console.log('Clear selection'),
    onApproveSelected: () => console.log('Approve selected'),
    onRejectSelected: () => console.log('Reject selected'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Large number of items selected.',
      },
    },
  },
};

// All selected
export const AllSelected: Story = {
  args: {
    selectedCount: 25,
    totalCount: 25,
    onClearSelection: () => console.log('Clear selection'),
    onApproveSelected: () => console.log('Approve selected'),
    onRejectSelected: () => console.log('Reject selected'),
  },
  parameters: {
    docs: {
      description: {
        story: 'All items in the list are selected.',
      },
    },
  },
};

// Interactive demo with messages
export const InteractiveDemo: Story = {
  render: () => {
    const messages: MessageData[] = [
      {
        id: '1',
        content: 'Sprint planning meeting tomorrow at 10 AM.',
        author: 'PM Team',
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        score: 0.82,
        classification: 'signal',
        topics: ['Meeting', 'Sprint'],
      },
      {
        id: '2',
        content: 'Anyone seen my coffee mug?',
        author: 'John',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        score: 0.08,
        classification: 'noise',
      },
      {
        id: '3',
        content: 'Database migration completed successfully.',
        author: 'DevOps Bot',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        score: 0.91,
        classification: 'signal',
        topics: ['Database', 'Deployment'],
      },
      {
        id: '4',
        content: 'LGTM!',
        author: 'Sarah',
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        score: 0.15,
        classification: 'noise',
      },
      {
        id: '5',
        content: 'API rate limiting needs to be implemented before launch.',
        author: 'Security Team',
        timestamp: new Date(Date.now() - 1000 * 60 * 3),
        score: 0.88,
        classification: 'signal',
        topics: ['Security', 'API'],
      },
    ];

    const {
      selectedIds,
      selectedCount,
      toggle,
      clearSelection,
      isSelected,
    } = useBulkSelection<MessageData>();

    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    const handleApprove = async () => {
      setIsApproving(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Approved:', Array.from(selectedIds));
      clearSelection();
      setIsApproving(false);
    };

    const handleReject = async () => {
      setIsRejecting(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Rejected:', Array.from(selectedIds));
      clearSelection();
      setIsRejecting(false);
    };

    return (
      <div className="min-h-screen bg-background">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Message Review Queue</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Select messages to perform bulk actions
          </p>
          <div className="space-y-4 max-w-2xl">
            {messages.map((msg) => (
              <MessageCard
                key={msg.id}
                message={msg}
                selected={isSelected(msg.id)}
                onSelect={() => toggle(msg.id)}
              />
            ))}
          </div>
          {/* Spacer to prevent content overlap with sticky bar */}
          <BulkActionBarSpacer visible={selectedCount > 0} />
        </div>

        <BulkActionBar
          selectedCount={selectedCount}
          totalCount={messages.length}
          onClearSelection={clearSelection}
          onApproveSelected={handleApprove}
          onRejectSelected={handleReject}
          isApproving={isApproving}
          isRejecting={isRejecting}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Full interactive demo with message cards and bulk actions. Select messages to see the bar appear.',
      },
    },
  },
};

// Mobile view
export const MobileView: Story = {
  args: {
    selectedCount: 3,
    totalCount: 15,
    onClearSelection: () => console.log('Clear selection'),
    onApproveSelected: () => console.log('Approve selected'),
    onRejectSelected: () => console.log('Reject selected'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Bar layout on mobile viewport.',
      },
    },
  },
};

// useBulkSelection hook demo
export const SelectionHookDemo: Story = {
  render: () => {
    type Item = { id: string; name: string };
    const items: Item[] = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
      { id: '3', name: 'Item 3' },
      { id: '4', name: 'Item 4' },
    ];

    const {
      selectedIds,
      selectedCount,
      toggle,
      selectAll,
      clearSelection,
      isSelected,
    } = useBulkSelection<Item>();

    return (
      <div className="p-6 space-y-4">
        <h3 className="font-medium">useBulkSelection Hook Demo</h3>

        <div className="flex gap-2">
          <button
            onClick={() => selectAll(items)}
            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded"
          >
            Select All
          </button>
          <button
            onClick={clearSelection}
            className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded"
          >
            Clear
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-3 border rounded flex items-center gap-3 cursor-pointer ${
                isSelected(item.id) ? 'bg-primary/10 border-primary' : ''
              }`}
              onClick={() => toggle(item.id)}
            >
              <input
                type="checkbox"
                checked={isSelected(item.id)}
                onChange={() => toggle(item.id)}
              />
              <span>{item.name}</span>
            </div>
          ))}
        </div>

        <div className="text-sm text-muted-foreground">
          Selected: {selectedCount} / {items.length}
          <br />
          IDs: {Array.from(selectedIds).join(', ') || '(none)'}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the useBulkSelection hook for managing selection state.',
      },
    },
  },
};
