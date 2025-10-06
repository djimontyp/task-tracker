import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, ArrowUpDown, Circle, CheckCircle2, Timer, XCircle, Tag } from 'lucide-react'

import type { Task } from '@/shared/types'
import { Checkbox, Button, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/shared/ui'

export const statusLabels: Record<string, { label: string; icon: React.ComponentType<any> }> = {
  open: { label: 'Backlog', icon: Timer },
  in_progress: { label: 'In Progress', icon: Circle },
  completed: { label: 'Done', icon: CheckCircle2 },
  closed: { label: 'Canceled', icon: XCircle },
  pending: { label: 'Pending', icon: Timer },
  cancelled: { label: 'Canceled', icon: XCircle },
}

export const priorityLabels: Record<string, { label: string; icon?: React.ComponentType<any> }> = {
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
      const id = row.getValue<any>('id')
      return <div className="text-xs font-medium text-muted-foreground">TASK-{String(id).padStart(4, '0')}</div>
    },
    enableSorting: false,
    size: 80,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const title = row.getValue<string>('title')
      const category = (row.original as Task).category
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {category ? (
            <Badge variant="secondary" className="rounded-sm px-2 py-0 text-[10px]">
              <Tag className="mr-1 h-3 w-3" />
              {category}
            </Badge>
          ) : null}
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const value = row.getValue<string>('status')
      const meta = statusLabels[value] ?? { label: value, icon: Circle }
      const Icon = meta.icon
      return (
        <div className="flex items-center gap-2 capitalize">
          <Icon className="h-4 w-4 text-muted-foreground" /> {meta.label}
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
    header: 'Priority',
    cell: ({ row }) => {
      const value = row.getValue<string>('priority')
      const meta = priorityLabels[value] ?? { label: value }
      return <div className="flex items-center gap-2">{meta.label}</div>
    },
    filterFn: (row, id, filterValues: string[]) => {
      if (!filterValues || filterValues.length === 0) return true
      const v = row.getValue<string>(id)
      return filterValues.includes(v)
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
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
              <MoreHorizontal className="h-4 w-4" />
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
