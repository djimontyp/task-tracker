import { ColumnDef } from '@tanstack/react-table'
import { EllipsisHorizontalIcon, CircleStackIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline'

import type { Task } from '@/shared/types'
import { Checkbox, Button, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/shared/ui'
import { DataTableColumnHeader } from '@/shared/components/DataTableColumnHeader'

export const statusLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  open: { label: 'Backlog', icon: ClockIcon },
  in_progress: { label: 'In Progress', icon: CircleStackIcon },
  completed: { label: 'Done', icon: CheckCircleIcon },
  closed: { label: 'Canceled', icon: XCircleIcon },
  pending: { label: 'Pending', icon: ClockIcon },
}

export const priorityLabels: Record<string, { label: string; icon?: React.ComponentType<{ className?: string }> }> = {
  low: { label: 'Low' },
  medium: { label: 'Medium' },
  high: { label: 'High' },
  urgent: { label: 'Urgent' },
  critical: { label: 'Critical' },
}

export const columns: ColumnDef<Task>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 28,
  },
  {
    accessorKey: 'id',
    header: 'Task',
    cell: ({ row }) => {
      const id = row.getValue<number | string>('id')
      return <div className="w-[80px] text-xs font-medium text-muted-foreground">TASK-{String(id).padStart(4, '0')}</div>
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const title = row.getValue<string>('title')
      const category = (row.original as Task).category
      return (
        <div className="flex space-x-2">
          {category && <Badge variant="outline">{category}</Badge>}
          <span className="max-w-[500px] truncate font-medium">{title}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const value = row.getValue<string>('status')
      const meta = statusLabels[value] ?? { label: value, icon: CircleStackIcon }
      const Icon = meta.icon
      return (
        <div className="flex w-[100px] items-center">
          {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
          <span>{meta.label}</span>
        </div>
      )
    },
    filterFn: (row, id, filterValues: string[]) => {
      if (!filterValues || filterValues.length === 0) return true
      const v = row.getValue<string>(id)
      return filterValues.includes(v)
    },
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const value = row.getValue<string>('priority')
      const meta = priorityLabels[value] ?? { label: value }
      const Icon = meta.icon
      return (
        <div className="flex items-center">
          {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
          <span>{meta.label}</span>
        </div>
      )
    },
    filterFn: (row, id, filterValues: string[]) => {
      if (!filterValues || filterValues.length === 0) return true
      const v = row.getValue<string>(id)
      return filterValues.includes(v)
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const d = row.getValue<string>('created_at') || (row.original as Task).createdAt
      return <div className="text-muted-foreground text-xs">{d ? new Date(d).toLocaleDateString() : '-'}</div>
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const task = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <EllipsisHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(String(task.id))}>
              Copy task ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
