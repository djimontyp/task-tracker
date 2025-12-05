import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table'
import { DataTableColumnHeader } from './index'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'

/**
 * DataTableColumnHeader provides sortable column headers with visual sort indicators.
 *
 * ## Design System Rules
 * - Displays arrow icons for sort direction (up = ascending, down = descending, chevron = unsorted)
 * - Interactive dropdown menu for sort control
 * - Non-sortable columns render as plain text
 * - 44px minimum touch target for mobile accessibility
 */

interface SampleData {
  id: number
  name: string
  score: number
}

const sampleData: SampleData[] = [
  { id: 1, name: 'Alice', score: 95 },
  { id: 2, name: 'Bob', score: 82 },
  { id: 3, name: 'Carol', score: 88 },
  { id: 4, name: 'David', score: 91 },
]

const meta: Meta<typeof DataTableColumnHeader> = {
  title: 'Components/DataTableColumnHeader',
  component: DataTableColumnHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Sortable column header with dropdown menu for ascending/descending sort control. Shows visual indicators for current sort state.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof DataTableColumnHeader>

export const Unsorted: Story = {
  render: () => {
    const [sorting, setSorting] = useState<SortingState>([])
    const columnHelper = createColumnHelper<SampleData>()

    const columns: ColumnDef<SampleData>[] = [
      columnHelper.accessor('name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        enableSorting: true,
      }),
      columnHelper.accessor('score', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Score" />,
        enableSorting: true,
      }),
    ]

    const table = useReactTable({
      data: sampleData,
      columns,
      state: { sorting },
      onSortingChange: setSorting,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
    })

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : typeof header.column.columnDef.header === 'function'
                      ? header.column.columnDef.header(header.getContext())
                      : header.column.columnDef.header}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{cell.renderValue() as React.ReactNode}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Default unsorted state showing chevron icon. Click to open sort menu.',
      },
    },
  },
}

export const SortedAscending: Story = {
  render: () => {
    const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
    const columnHelper = createColumnHelper<SampleData>()

    const columns: ColumnDef<SampleData>[] = [
      columnHelper.accessor('name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        enableSorting: true,
      }),
      columnHelper.accessor('score', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Score" />,
        enableSorting: true,
      }),
    ]

    const table = useReactTable({
      data: sampleData,
      columns,
      state: { sorting },
      onSortingChange: setSorting,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
    })

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : typeof header.column.columnDef.header === 'function'
                      ? header.column.columnDef.header(header.getContext())
                      : header.column.columnDef.header}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{cell.renderValue() as React.ReactNode}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Column sorted in ascending order (A→Z, 0→9) showing up arrow icon.',
      },
    },
  },
}

export const SortedDescending: Story = {
  render: () => {
    const [sorting, setSorting] = useState<SortingState>([{ id: 'score', desc: true }])
    const columnHelper = createColumnHelper<SampleData>()

    const columns: ColumnDef<SampleData>[] = [
      columnHelper.accessor('name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        enableSorting: true,
      }),
      columnHelper.accessor('score', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Score" />,
        enableSorting: true,
      }),
    ]

    const table = useReactTable({
      data: sampleData,
      columns,
      state: { sorting },
      onSortingChange: setSorting,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
    })

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : typeof header.column.columnDef.header === 'function'
                      ? header.column.columnDef.header(header.getContext())
                      : header.column.columnDef.header}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{cell.renderValue() as React.ReactNode}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Column sorted in descending order (Z→A, 9→0) showing down arrow icon.',
      },
    },
  },
}

export const NonSortable: Story = {
  render: () => {
    const columnHelper = createColumnHelper<SampleData>()

    const columns: ColumnDef<SampleData>[] = [
      columnHelper.accessor('id', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
        enableSorting: false, // Explicitly disabled
      }),
      columnHelper.accessor('name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        enableSorting: true,
      }),
    ]

    const table = useReactTable({
      data: sampleData,
      columns,
      getCoreRowModel: getCoreRowModel(),
    })

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : typeof header.column.columnDef.header === 'function'
                      ? header.column.columnDef.header(header.getContext())
                      : header.column.columnDef.header}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{cell.renderValue() as React.ReactNode}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Non-sortable columns render as plain text without interactive controls (e.g., ID column).',
      },
    },
  },
}
