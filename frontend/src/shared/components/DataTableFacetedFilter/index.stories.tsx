import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  ColumnDef,
  ColumnFiltersState,
  createColumnHelper,
} from '@tanstack/react-table'
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  ShieldCheck,
} from 'lucide-react'
import { DataTableFacetedFilter } from './index'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'

/**
 * DataTableFacetedFilter provides a multi-select filter popover for categorical data.
 *
 * ## Design System Rules
 * - Checkbox-based multi-select with visual selection state
 * - Shows count badges for selected filters
 * - Displays facet counts (number of items per option)
 * - Optional icons for each filter option
 * - Clear filters action when selections exist
 * - 44px touch target for mobile
 */

interface SampleData {
  id: number
  name: string
  status: 'active' | 'inactive' | 'pending'
  role: 'user' | 'admin' | 'moderator'
}

const sampleData: SampleData[] = [
  { id: 1, name: 'Alice', status: 'active', role: 'admin' },
  { id: 2, name: 'Bob', status: 'active', role: 'user' },
  { id: 3, name: 'Carol', status: 'inactive', role: 'moderator' },
  { id: 4, name: 'David', status: 'pending', role: 'user' },
  { id: 5, name: 'Eve', status: 'active', role: 'user' },
  { id: 6, name: 'Frank', status: 'inactive', role: 'admin' },
]

const statusOptions = [
  { label: 'Active', value: 'active', icon: CheckCircle },
  { label: 'Inactive', value: 'inactive', icon: XCircle },
  { label: 'Pending', value: 'pending', icon: Clock },
]

const roleOptions = [
  { label: 'User', value: 'user', icon: User },
  { label: 'Admin', value: 'admin', icon: ShieldCheck },
  { label: 'Moderator', value: 'moderator' },
]

const meta: Meta<typeof DataTableFacetedFilter> = {
  title: 'Components/DataTableFacetedFilter',
  component: DataTableFacetedFilter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Multi-select filter popover with checkbox selections, facet counts, and clear filters action. Integrates with TanStack Table filtering.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof DataTableFacetedFilter>

export const NoSelection: Story = {
  render: () => {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const columnHelper = createColumnHelper<SampleData>()

    const columns: ColumnDef<SampleData>[] = [
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('status', { header: 'Status' }),
      columnHelper.accessor('role', { header: 'Role' }),
    ]

    const table = useReactTable({
      data: sampleData,
      columns,
      state: { columnFilters },
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    return (
      <div className="space-y-4">
        <DataTableFacetedFilter
          column={table.getColumn('status')}
          title="Status"
          options={statusOptions}
        />
        <div className="text-sm text-muted-foreground">
          {table.getRowModel().rows.length} of {sampleData.length} rows displayed
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state with no filters selected. Shows filter title and icon.',
      },
    },
  },
}

export const SingleSelection: Story = {
  render: () => {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([{ id: 'status', value: ['active'] }])
    const columnHelper = createColumnHelper<SampleData>()

    const columns: ColumnDef<SampleData>[] = [
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('status', { header: 'Status' }),
      columnHelper.accessor('role', { header: 'Role' }),
    ]

    const table = useReactTable({
      data: sampleData,
      columns,
      state: { columnFilters },
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    return (
      <div className="space-y-4">
        <DataTableFacetedFilter
          column={table.getColumn('status')}
          title="Status"
          options={statusOptions}
        />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.original.name}</TableCell>
                  <TableCell className="capitalize">{row.original.status}</TableCell>
                  <TableCell className="capitalize">{row.original.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="text-sm text-muted-foreground">
          {table.getRowModel().rows.length} of {sampleData.length} rows displayed
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Single filter selected. Shows filter label badge and filters table to matching rows.',
      },
    },
  },
}

export const MultipleSelections: Story = {
  render: () => {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
      { id: 'status', value: ['active', 'pending'] },
    ])
    const columnHelper = createColumnHelper<SampleData>()

    const columns: ColumnDef<SampleData>[] = [
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('status', { header: 'Status' }),
      columnHelper.accessor('role', { header: 'Role' }),
    ]

    const table = useReactTable({
      data: sampleData,
      columns,
      state: { columnFilters },
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    return (
      <div className="space-y-4">
        <DataTableFacetedFilter
          column={table.getColumn('status')}
          title="Status"
          options={statusOptions}
        />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.original.name}</TableCell>
                  <TableCell className="capitalize">{row.original.status}</TableCell>
                  <TableCell className="capitalize">{row.original.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="text-sm text-muted-foreground">
          {table.getRowModel().rows.length} of {sampleData.length} rows displayed
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Multiple filters selected (2 items). Shows individual badges on desktop, count badge on mobile.',
      },
    },
  },
}

export const ManySelections: Story = {
  render: () => {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
      { id: 'status', value: ['active', 'inactive', 'pending'] },
    ])
    const columnHelper = createColumnHelper<SampleData>()

    const columns: ColumnDef<SampleData>[] = [
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('status', { header: 'Status' }),
      columnHelper.accessor('role', { header: 'Role' }),
    ]

    const table = useReactTable({
      data: sampleData,
      columns,
      state: { columnFilters },
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    return (
      <div className="space-y-4">
        <DataTableFacetedFilter
          column={table.getColumn('status')}
          title="Status"
          options={statusOptions}
        />
        <div className="text-sm text-muted-foreground">
          {table.getRowModel().rows.length} of {sampleData.length} rows displayed
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'More than 2 selections. Shows "3 selected" badge instead of individual labels.',
      },
    },
  },
}

export const WithFacetCounts: Story = {
  render: () => {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const columnHelper = createColumnHelper<SampleData>()

    const columns: ColumnDef<SampleData>[] = [
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('status', { header: 'Status' }),
      columnHelper.accessor('role', { header: 'Role' }),
    ]

    const table = useReactTable({
      data: sampleData,
      columns,
      state: { columnFilters },
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <DataTableFacetedFilter
            column={table.getColumn('status')}
            title="Status"
            options={statusOptions}
          />
          <DataTableFacetedFilter
            column={table.getColumn('role')}
            title="Role"
            options={roleOptions}
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.original.name}</TableCell>
                  <TableCell className="capitalize">{row.original.status}</TableCell>
                  <TableCell className="capitalize">{row.original.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="text-sm text-muted-foreground">
          {table.getRowModel().rows.length} of {sampleData.length} rows displayed
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Open popover to see facet counts next to each option (e.g., "Active 3", "User 3"). Counts update based on current filtered dataset.',
      },
    },
  },
}

export const WithIcons: Story = {
  render: () => {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const columnHelper = createColumnHelper<SampleData>()

    const columns: ColumnDef<SampleData>[] = [
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('status', { header: 'Status' }),
      columnHelper.accessor('role', { header: 'Role' }),
    ]

    const table = useReactTable({
      data: sampleData,
      columns,
      state: { columnFilters },
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    return (
      <div className="space-y-4">
        <DataTableFacetedFilter
          column={table.getColumn('status')}
          title="Status"
          options={statusOptions}
        />
        <div className="text-sm text-muted-foreground">
          Open popover to see icons next to filter options (CheckCircle for Active, XCircle for
          Inactive, Clock for Pending)
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Filter options with custom icons for visual categorization.',
      },
    },
  },
}

export const ClearFilters: Story = {
  render: () => {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
      { id: 'status', value: ['active', 'pending'] },
    ])
    const columnHelper = createColumnHelper<SampleData>()

    const columns: ColumnDef<SampleData>[] = [
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('status', { header: 'Status' }),
      columnHelper.accessor('role', { header: 'Role' }),
    ]

    const table = useReactTable({
      data: sampleData,
      columns,
      state: { columnFilters },
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    return (
      <div className="space-y-4">
        <DataTableFacetedFilter
          column={table.getColumn('status')}
          title="Status"
          options={statusOptions}
        />
        <div className="text-sm text-muted-foreground">
          Open popover and click "Clear filters" at the bottom to remove all selections
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.original.name}</TableCell>
                  <TableCell className="capitalize">{row.original.status}</TableCell>
                  <TableCell className="capitalize">{row.original.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="text-sm text-muted-foreground">
          {table.getRowModel().rows.length} of {sampleData.length} rows displayed
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          '"Clear filters" action appears at bottom of popover when any selections exist. Removes all filter selections.',
      },
    },
  },
}
