import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
} from '@tanstack/react-table'
import { DataTablePagination } from './index'

/**
 * DataTablePagination provides pagination controls for data tables.
 *
 * ## Design System Rules
 * - Responsive layout: stacked on mobile, horizontal on desktop
 * - 44px minimum touch targets for navigation buttons
 * - Page size selector hidden on mobile to save space
 * - Jump-to-page input for quick navigation
 */

interface SampleData {
  id: number
  name: string
  email: string
}

const sampleData: SampleData[] = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
}))

const columns: ColumnDef<SampleData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
]

const meta: Meta<typeof DataTablePagination> = {
  title: 'Patterns/DataTable/Pagination',
  component: DataTablePagination,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Pagination controls for TanStack Table with page size selector and jump-to-page input.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof DataTablePagination>

export const Default: Story = {
  render: () => {
    const table = useReactTable({
      data: sampleData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      initialState: {
        pagination: {
          pageSize: 10,
          pageIndex: 0,
        },
      },
    })

    return <DataTablePagination table={table} />
  },
}

export const CustomPageSizes: Story = {
  render: () => {
    const table = useReactTable({
      data: sampleData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      initialState: {
        pagination: {
          pageSize: 25,
          pageIndex: 0,
        },
      },
    })

    return <DataTablePagination table={table} pageSizeOptions={[5, 10, 25, 50, 100]} />
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom page size options (5, 10, 25, 50, 100).',
      },
    },
  },
}

export const SmallDataset: Story = {
  render: () => {
    const smallData = sampleData.slice(0, 15)
    const table = useReactTable({
      data: smallData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      initialState: {
        pagination: {
          pageSize: 10,
          pageIndex: 0,
        },
      },
    })

    return <DataTablePagination table={table} />
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination with small dataset (15 items, 2 pages).',
      },
    },
  },
}

export const SinglePage: Story = {
  render: () => {
    const singlePageData = sampleData.slice(0, 5)
    const table = useReactTable({
      data: singlePageData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      initialState: {
        pagination: {
          pageSize: 10,
          pageIndex: 0,
        },
      },
    })

    return <DataTablePagination table={table} />
  },
  parameters: {
    docs: {
      description: {
        story: 'When data fits on single page (5 items, page size 10), navigation buttons are hidden.',
      },
    },
  },
}

export const ManyPages: Story = {
  render: () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
    }))

    const table = useReactTable({
      data: largeData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      initialState: {
        pagination: {
          pageSize: 10,
          pageIndex: 0,
        },
      },
    })

    return <DataTablePagination table={table} />
  },
  parameters: {
    docs: {
      description: {
        story: 'Pagination with large dataset (1000 items, 100 pages). Use jump-to-page input for quick navigation.',
      },
    },
  },
}

// Mobile responsive
export const MobileLayout: Story = {
  render: () => {
    const table = useReactTable({
      data: sampleData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      initialState: {
        pagination: {
          pageSize: 10,
          pageIndex: 0,
        },
      },
    })

    return <DataTablePagination table={table} />
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'On mobile, page size selector is hidden and controls stack vertically.',
      },
    },
  },
}
