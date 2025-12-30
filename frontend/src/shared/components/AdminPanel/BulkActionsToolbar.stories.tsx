import { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { useUiStore } from '@/shared/store/uiStore';
import { TooltipProvider } from '@/shared/ui/tooltip';

// Decorator to set admin mode state
const AdminModeDecorator = (Story: React.ComponentType) => {
  useEffect(() => {
    useUiStore.setState({ isAdminMode: true });
    return () => {
      useUiStore.setState({ isAdminMode: false });
    };
  }, []);

  return (
    <TooltipProvider>
      <Story />
    </TooltipProvider>
  );
};

const meta: Meta<typeof BulkActionsToolbar> = {
  title: 'Components/BulkActionsToolbar',
  component: BulkActionsToolbar,
  tags: ['autodocs'],
  decorators: [AdminModeDecorator],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Toolbar for bulk actions on selected items. Shows select-all checkbox and action buttons (Approve, Archive, Delete, Clear).',
      },
    },
  },
  argTypes: {
    selectedCount: {
      control: { type: 'number', min: 0 },
      description: 'Number of selected items',
    },
    totalCount: {
      control: { type: 'number', min: 0 },
      description: 'Total number of items',
    },
    onSelectAll: {
      action: 'selectAll',
      description: 'Callback when select all is clicked',
    },
    onClearSelection: {
      action: 'clearSelection',
      description: 'Callback when clear is clicked',
    },
    onApprove: {
      action: 'approve',
      description: 'Callback for approve action',
    },
    onArchive: {
      action: 'archive',
      description: 'Callback for archive action',
    },
    onDelete: {
      action: 'delete',
      description: 'Callback for delete action',
    },
  },
};
export default meta;

type Story = StoryObj<typeof BulkActionsToolbar>;

export const NoSelection: Story = {
  args: {
    selectedCount: 0,
    totalCount: 25,
    onSelectAll: () => {},
    onClearSelection: () => {},
    onApprove: () => {},
    onArchive: () => {},
    onDelete: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'No items selected - shows only checkbox.',
      },
    },
  },
};

export const SomeSelected: Story = {
  args: {
    selectedCount: 5,
    totalCount: 25,
    onSelectAll: () => {},
    onClearSelection: () => {},
    onApprove: () => {},
    onArchive: () => {},
    onDelete: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Some items selected - shows indeterminate checkbox and action buttons.',
      },
    },
  },
};

export const AllSelected: Story = {
  args: {
    selectedCount: 25,
    totalCount: 25,
    onSelectAll: () => {},
    onClearSelection: () => {},
    onApprove: () => {},
    onArchive: () => {},
    onDelete: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'All items selected - shows checked checkbox.',
      },
    },
  },
};

export const ApproveOnly: Story = {
  args: {
    selectedCount: 3,
    totalCount: 10,
    onSelectAll: () => {},
    onClearSelection: () => {},
    onApprove: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Only approve action available.',
      },
    },
  },
};

export const DeleteOnly: Story = {
  args: {
    selectedCount: 2,
    totalCount: 10,
    onSelectAll: () => {},
    onClearSelection: () => {},
    onDelete: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Only delete action available.',
      },
    },
  },
};

export const Interactive: Story = {
  render: function InteractiveBulkActions() {
    const [selected, setSelected] = useState<number[]>([1, 3, 5]);
    const total = 10;

    return (
      <div className="space-y-4">
        <BulkActionsToolbar
          selectedCount={selected.length}
          totalCount={total}
          onSelectAll={() => setSelected(Array.from({ length: total }, (_, i) => i))}
          onClearSelection={() => setSelected([])}
          onApprove={() => alert(`Approved ${selected.length} items`)}
          onArchive={() => alert(`Archived ${selected.length} items`)}
          onDelete={() => {
            alert(`Deleted ${selected.length} items`);
            setSelected([]);
          }}
        />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() =>
                setSelected((prev) =>
                  prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                )
              }
              className={`p-4 border rounded-lg text-sm ${
                selected.includes(i) ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              Item {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example - click items to select/deselect, use toolbar actions.',
      },
    },
  },
};

export const InListContext: Story = {
  args: {
    selectedCount: 3,
    totalCount: 8,
    onSelectAll: () => {},
    onClearSelection: () => {},
    onApprove: () => {},
    onDelete: () => {},
  },
  render: (args) => (
    <div className="border rounded-lg overflow-hidden max-w-lg">
      <BulkActionsToolbar {...args} />
      <div className="p-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`p-3 border rounded-lg text-sm flex items-center gap-2 ${
              i < 3 ? 'bg-primary/5 border-primary/20' : ''
            }`}
          >
            <input type="checkbox" checked={i < 3} readOnly />
            <span>Proposal #{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Toolbar above a list of items with selection.',
      },
    },
  },
};
