import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  VisibilityState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { DataTableToolbar } from './index'
import { Button } from '@/shared/ui/button'
import { Plus, Filter } from 'lucide-react'

/**
 * DataTableToolbar provides search, filters, and column visibility controls.
 *
 * ## Design System Rules
 * - Responsive layout: stacked on mobile, horizontal on desktop
 * - Search input max-width for better UX
 * - Column visibility dropdown with command palette
 * - Custom filter components via children prop
 */

interface SampleData {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive'
  role: 'user' | 'admin'
}

const sampleData: SampleData[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  status: i % 3 === 0 ? 'inactive' : 'active',
  role: i % 5 === 0 ? 'admin' : 'user',
}))

const columns: ColumnDef<SampleData>[] = [
  { accessorKey: 'id', header: 'ID', enableHiding: false },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'role', header: 'Role' },
]

const meta: Meta<typeof DataTableToolbar> = {
  title: 'Shared/DataTableToolbar',
  component: DataTableToolbar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Toolbar for data tables with search, filters, and column visibility controls.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof DataTableToolbar>

export const Default: Story = {
  render: () => {
    const [globalFilter, setGlobalFilter] = useState('')
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    const table = useReactTable({
      data: sampleData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      state: {
        globalFilter,
        columnVisibility,
      },
      onGlobalFilterChange: setGlobalFilter,
      onColumnVisibilityChange: setColumnVisibility,
    })

    return (
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
      />
    )
  },
}

export const WithCustomPlaceholder: Story = {
  render: () => {
    const [globalFilter, setGlobalFilter] = useState('')
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    const table = useReactTable({
      data: sampleData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      state: {
        globalFilter,
        columnVisibility,
      },
      onGlobalFilterChange: setGlobalFilter,
      onColumnVisibilityChange: setColumnVisibility,
    })

    return (
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        searchPlaceholder="Search users by name or email..."
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom search placeholder text.',
      },
    },
  },
}

export const WithActions: Story = {
  render: () => {
    const [globalFilter, setGlobalFilter] = useState('')
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    const table = useReactTable({
      data: sampleData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      state: {
        globalFilter,
        columnVisibility,
      },
      onGlobalFilterChange: setGlobalFilter,
      onColumnVisibilityChange: setColumnVisibility,
    })

    return (
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
      >
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </DataTableToolbar>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Toolbar with custom action buttons via children prop.',
      },
    },
  },
}

export const WithFilters: Story = {
  render: () => {
    const [globalFilter, setGlobalFilter] = useState('')
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    const table = useReactTable({
      data: sampleData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      state: {
        globalFilter,
        columnVisibility,
      },
      onGlobalFilterChange: setGlobalFilter,
      onColumnVisibilityChange: setColumnVisibility,
    })

    return (
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
      >
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4" />
          Status
        </Button>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4" />
          Role
        </Button>
      </DataTableToolbar>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Toolbar with filter buttons for status and role columns.',
      },
    },
  },
}

export const HiddenColumns: Story = {
  render: () => {
    const [globalFilter, setGlobalFilter] = useState('')
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
      email: false,
      role: false,
    })

    const table = useReactTable({
      data: sampleData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      state: {
        globalFilter,
        columnVisibility,
      },
      onGlobalFilterChange: setGlobalFilter,
      onColumnVisibilityChange: setColumnVisibility,
    })

    return (
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Toolbar with some columns hidden by default (Email, Role). Click "View" to toggle visibility.',
      },
    },
  },
}

// Mobile responsive
export const MobileLayout: Story = {
  render: () => {
    const [globalFilter, setGlobalFilter] = useState('')
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    const table = useReactTable({
      data: sampleData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      state: {
        globalFilter,
        columnVisibility,
      },
      onGlobalFilterChange: setGlobalFilter,
      onColumnVisibilityChange: setColumnVisibility,
    })

    return (
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
      >
        <Button size="sm" className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </DataTableToolbar>
    )
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'On mobile, toolbar items stack vertically and take full width.',
      },
    },
  },
}
