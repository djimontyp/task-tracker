import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { DataTableMobileCard, MobileCardField } from './index'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

/**
 * DataTableMobileCard provides a responsive card view for displaying table data on mobile devices.
 *
 * ## Design System Rules
 * - Clickable card with hover and focus states
 * - Cursor pointer for interactive cards
 * - Selection state with border and background change
 * - 44px minimum touch target for interactive elements
 * - Works with MobileCardField for consistent label/value display
 */

const meta: Meta<typeof DataTableMobileCard> = {
  title: 'Patterns/DataTable/MobileCard',
  component: DataTableMobileCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Responsive card component for mobile table views. Provides clickable cards with hover states, selection highlighting, and field components for structured data.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof DataTableMobileCard>

export const Default: Story = {
  render: () => (
    <DataTableMobileCard>
      <div className="space-y-2">
        <MobileCardField label="Name" value="Alice Johnson" />
        <MobileCardField label="Email" value="alice@example.com" />
        <MobileCardField label="Status" value={<Badge variant="default">Active</Badge>} />
      </div>
    </DataTableMobileCard>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Basic card with structured fields using MobileCardField components.',
      },
    },
  },
}

export const Clickable: Story = {
  render: () => {
    const [clicked, setClicked] = useState(false)

    return (
      <div className="space-y-4">
        <DataTableMobileCard onClick={() => setClicked(!clicked)}>
          <div className="space-y-2">
            <MobileCardField label="Name" value="Bob Smith" />
            <MobileCardField label="Email" value="bob@example.com" />
            <MobileCardField
              label="Status"
              value={
                <Badge variant="outline" className="gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Pending
                </Badge>
              }
            />
          </div>
        </DataTableMobileCard>
        {clicked && (
          <div className="text-sm text-muted-foreground">Card was clicked! Try clicking again.</div>
        )}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive card with onClick handler. Shows hover state and cursor pointer.',
      },
    },
  },
}

export const Selected: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<number | null>(1)

    const users = [
      { id: 1, name: 'Alice Johnson', email: 'alice@example.com', status: 'active' },
      { id: 2, name: 'Bob Smith', email: 'bob@example.com', status: 'pending' },
      { id: 3, name: 'Carol White', email: 'carol@example.com', status: 'inactive' },
    ]

    return (
      <div className="space-y-2">
        {users.map((user) => (
          <DataTableMobileCard
            key={user.id}
            isSelected={selectedId === user.id}
            onClick={() => setSelectedId(user.id)}
          >
            <div className="space-y-2">
              <MobileCardField label="Name" value={user.name} />
              <MobileCardField label="Email" value={user.email} />
              <MobileCardField
                label="Status"
                value={
                  <Badge
                    variant={
                      user.status === 'active'
                        ? 'default'
                        : user.status === 'inactive'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="capitalize"
                  >
                    {user.status}
                  </Badge>
                }
              />
            </div>
          </DataTableMobileCard>
        ))}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Selectable cards with highlighted state. Selected card shows accent background and primary border.',
      },
    },
  },
}

export const WithStatusBadges: Story = {
  render: () => (
    <div className="space-y-2">
      <DataTableMobileCard>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Alice Johnson</h3>
          <Badge variant="default" className="gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            Active
          </Badge>
        </div>
        <div className="space-y-2">
          <MobileCardField label="Email" value="alice@example.com" />
          <MobileCardField label="Role" value="Admin" />
          <MobileCardField label="Last Active" value="2 hours ago" />
        </div>
      </DataTableMobileCard>

      <DataTableMobileCard>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Bob Smith</h3>
          <Badge variant="outline" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </Badge>
        </div>
        <div className="space-y-2">
          <MobileCardField label="Email" value="bob@example.com" />
          <MobileCardField label="Role" value="User" />
          <MobileCardField label="Last Active" value="Never" />
        </div>
      </DataTableMobileCard>

      <DataTableMobileCard>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Carol White</h3>
          <Badge variant="secondary" className="gap-1.5">
            <XCircle className="h-3.5 w-3.5" />
            Inactive
          </Badge>
        </div>
        <div className="space-y-2">
          <MobileCardField label="Email" value="carol@example.com" />
          <MobileCardField label="Role" value="Moderator" />
          <MobileCardField label="Last Active" value="3 days ago" />
        </div>
      </DataTableMobileCard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Cards with status badges featuring icons and text (WCAG compliant). Title and badge in header row.',
      },
    },
  },
}

export const WithActions: Story = {
  render: () => (
    <DataTableMobileCard>
      <div className="space-y-4">
        <div className="space-y-2">
          <MobileCardField label="Name" value="Alice Johnson" />
          <MobileCardField label="Email" value="alice@example.com" />
          <MobileCardField
            label="Status"
            value={
              <Badge variant="default" className="gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                Active
              </Badge>
            }
          />
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => alert('Edit')}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" className="flex-1" onClick={() => alert('Delete')}>
            Delete
          </Button>
        </div>
      </div>
    </DataTableMobileCard>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card with action buttons in footer. Buttons span full width for easy tapping.',
      },
    },
  },
}

export const CustomContent: Story = {
  render: () => (
    <DataTableMobileCard>
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
            AJ
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Alice Johnson</h3>
            <p className="text-sm text-muted-foreground">alice@example.com</p>
          </div>
          <Badge variant="default" className="gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            Active
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Role
            </span>
            <p className="text-sm mt-2">Admin</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Last Active
            </span>
            <p className="text-sm mt-2">2 hours ago</p>
          </div>
        </div>
      </div>
    </DataTableMobileCard>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card with custom layout including avatar and grid-based fields.',
      },
    },
  },
}

export const Compact: Story = {
  render: () => (
    <DataTableMobileCard>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">Alice Johnson</span>
          <Badge variant="default" className="gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            Active
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">alice@example.com</p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Admin</span>
          <span>•</span>
          <span>Last active: 2h ago</span>
        </div>
      </div>
    </DataTableMobileCard>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact card layout with inline metadata. Good for lists with many items.',
      },
    },
  },
}

export const MobileViewportDemo: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<number | null>(null)

    const items = [
      {
        id: 1,
        name: 'Alice Johnson',
        email: 'alice@example.com',
        status: 'active' as const,
        role: 'Admin',
      },
      {
        id: 2,
        name: 'Bob Smith',
        email: 'bob@example.com',
        status: 'pending' as const,
        role: 'User',
      },
      {
        id: 3,
        name: 'Carol White',
        email: 'carol@example.com',
        status: 'inactive' as const,
        role: 'Moderator',
      },
    ]

    return (
      <div className="space-y-2">
        {items.map((item) => (
          <DataTableMobileCard
            key={item.id}
            isSelected={selectedId === item.id}
            onClick={() => setSelectedId(item.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{item.name}</h3>
              <Badge
                variant={
                  item.status === 'active'
                    ? 'default'
                    : item.status === 'inactive'
                    ? 'secondary'
                    : 'outline'
                }
                className="gap-1.5 capitalize"
              >
                {item.status === 'active' && <CheckCircle className="h-3.5 w-3.5" />}
                {item.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                {item.status === 'inactive' && <XCircle className="h-3.5 w-3.5" />}
                {item.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <MobileCardField label="Email" value={item.email} />
              <MobileCardField label="Role" value={item.role} />
            </div>
          </DataTableMobileCard>
        ))}
      </div>
    )
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Full mobile card list example with selection, status badges, and structured fields. View in mobile viewport.',
      },
    },
  },
}
