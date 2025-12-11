import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  createColumnHelper,
} from '@tanstack/react-table'
import { DataTable } from './index'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'

/**
 * DataTable provides a flexible data table with responsive mobile cards, column resizing, and row selection.
 *
 * ## Design System Rules
 * - Desktop: Full table with column headers
 * - Mobile: Card-based layout via renderMobileCard prop
 * - Column resizing enabled by default (44px touch target on resize handles)
 * - Row click handler for navigation/drill-down
 * - Empty state with custom message
 */

interface SampleData {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive' | 'pending'
  role: 'user' | 'admin' | 'moderator'
  lastActive: string
}

const sampleData: SampleData[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    status: 'active',
    role: 'admin',
    lastActive: '2 hours ago',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    status: 'active',
    role: 'user',
    lastActive: '5 minutes ago',
  },
  {
    id: 3,
    name: 'Carol White',
    email: 'carol@example.com',
    status: 'inactive',
    role: 'moderator',
    lastActive: '3 days ago',
  },
  {
    id: 4,
    name: 'David Brown',
    email: 'david@example.com',
    status: 'pending',
    role: 'user',
    lastActive: 'Never',
  },
]

const columnHelper = createColumnHelper<SampleData>()

const columns: ColumnDef<SampleData>[] = [
  columnHelper.accessor('id', {
    header: 'ID',
    size: 60,
    enableResizing: false,
  }),
  columnHelper.accessor('name', {
    header: 'Name',
    size: 200,
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    size: 250,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    size: 120,
    cell: ({ getValue }) => {
      const status = getValue()
      const variant =
        status === 'active' ? 'default' : status === 'inactive' ? 'secondary' : 'outline'
      return (
        <Badge variant={variant} className="capitalize">
          {status}
        </Badge>
      )
    },
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    size: 120,
    cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
  }),
  columnHelper.accessor('lastActive', {
    header: 'Last Active',
    size: 150,
  }),
]

const meta: Meta<typeof DataTable> = {
  title: 'Patterns/DataTable/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A fully-featured data table with column resizing, responsive mobile cards, and row interactions.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof DataTable>

export const Default: Story = {
  render: () => {
    const table = useReactTable({
      data: sampleData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      enableColumnResizing: true,
      columnResizeMode: 'onChange',
    })

    return <DataTable table={table} columns={columns} />
  },
}

export const WithRowClick: Story = {
  render: () => {
    const table = useReactTable({
      data: sampleData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      enableColumnResizing: true,
      columnResizeMode: 'onChange',
    })

    return (
      <DataTable
        table={table}
        columns={columns}
        onRowClick={(row) => alert(`Clicked: ${row.name} (ID: ${row.id})`)}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Rows are clickable with hover and focus states for accessibility.',
      },
    },
  },
}

export const EmptyState: Story = {
  render: () => {
    const table = useReactTable({
      data: [],
      columns,
      getCoreRowModel: getCoreRowModel(),
      enableColumnResizing: true,
      columnResizeMode: 'onChange',
    })

    return (
      <DataTable
        table={table}
        columns={columns}
        emptyMessage="No users found. Try adjusting your filters."
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom empty state message when no data available.',
      },
    },
  },
}

export const ResizingDisabled: Story = {
  render: () => {
    const table = useReactTable({
      data: sampleData,
      columns,
      getCoreRowModel: getCoreRowModel(),
    })

    return <DataTable table={table} columns={columns} enableResizing={false} />
  },
  parameters: {
    docs: {
      description: {
        story: 'Column resizing disabled for simpler layouts.',
      },
    },
  },
}

export const MobileCardLayout: Story = {
  render: () => {
    const table = useReactTable({
      data: sampleData,
      columns,
      getCoreRowModel: getCoreRowModel(),
    })

    return (
      <DataTable
        table={table}
        columns={columns}
        renderMobileCard={(row) => (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{row.name}</h3>
              <Badge
                variant={
                  row.status === 'active'
                    ? 'default'
                    : row.status === 'inactive'
                    ? 'secondary'
                    : 'outline'
                }
                className="capitalize"
              >
                {row.status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>{row.email}</p>
              <p>
                <span className="capitalize">{row.role}</span> • Last active: {row.lastActive}
              </p>
            </div>
          </Card>
        )}
        onRowClick={(row) => console.log('Clicked:', row)}
      />
    )
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'On mobile, table switches to card-based layout using renderMobileCard prop. Cards are clickable when onRowClick is provided.',
      },
    },
  },
}

export const LongContent: Story = {
  render: () => {
    const longData: SampleData[] = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1} with a very long name that might wrap`,
      email: `verylongemail${i + 1}@example-domain.com`,
      status: ['active', 'inactive', 'pending'][i % 3] as SampleData['status'],
      role: ['user', 'admin', 'moderator'][i % 3] as SampleData['role'],
      lastActive: `${i + 1} minutes ago`,
    }))

    const table = useReactTable({
      data: longData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      enableColumnResizing: true,
      columnResizeMode: 'onChange',
    })

    return <DataTable table={table} columns={columns} />
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table with many rows and long content. Horizontal scroll enabled automatically when content overflows.',
      },
    },
  },
}

export const MinimalColumns: Story = {
  render: () => {
    const minimalColumns: ColumnDef<SampleData>[] = [
      columnHelper.accessor('name', {
        header: 'Name',
        size: 300,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        size: 150,
        cell: ({ getValue }) => {
          const status = getValue()
          const variant =
            status === 'active' ? 'default' : status === 'inactive' ? 'secondary' : 'outline'
          return (
            <Badge variant={variant} className="capitalize">
              {status}
            </Badge>
          )
        },
      }),
    ]

    const table = useReactTable({
      data: sampleData,
      columns: minimalColumns,
      getCoreRowModel: getCoreRowModel(),
      enableColumnResizing: true,
      columnResizeMode: 'onChange',
    })

    return <DataTable table={table} columns={minimalColumns} />
  },
  parameters: {
    docs: {
      description: {
        story: 'Simple table with just 2 columns.',
      },
    },
  },
}

export const WithActions: Story = {
  render: () => {
    const actionColumns: ColumnDef<SampleData>[] = [
      ...columns,
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        size: 150,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => alert(`Edit ${row.original.name}`)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => alert(`Delete ${row.original.name}`)}
            >
              Delete
            </Button>
          </div>
        ),
      }),
    ]

    const table = useReactTable({
      data: sampleData,
      columns: actionColumns,
      getCoreRowModel: getCoreRowModel(),
      enableColumnResizing: true,
      columnResizeMode: 'onChange',
    })

    return <DataTable table={table} columns={actionColumns} />
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with action buttons in each row.',
      },
    },
  },
}
