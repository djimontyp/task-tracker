import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Mail, User, X } from 'lucide-react'

import { Checkbox, Button, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/shared/ui'
import { DataTableColumnHeader } from '@/shared/components/DataTableColumnHeader'
import { Message } from '@/shared/types'
import { formatFullDate } from '@/shared/utils/date'

export interface ColumnsCallbacks {
  onReset?: () => void
  hasActiveFilters?: boolean
}

export const sourceLabels: Record<string, { label: string; icon: React.ComponentType<any> }> = {
  telegram: { label: 'Telegram', icon: Mail },
  api: { label: 'API', icon: Mail },
  slack: { label: 'Slack', icon: Mail },
}

export const statusLabels: Record<string, { label: string }> = {
  analyzed: { label: 'Analyzed' },
  pending: { label: 'Pending' },
}

export const createColumns = (callbacks?: ColumnsCallbacks): ColumnDef<Message>[] => [
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
    header: 'ID',
    cell: ({ row }) => {
      const id = row.getValue<any>('id')
      return <div className="w-[60px] text-xs font-medium text-muted-foreground">MSG-{String(id).padStart(4, '0')}</div>
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'author_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Author" />
    ),
    cell: ({ row }) => {
      const authorName = row.getValue<string>('author_name') || row.original.author
      const avatarUrl = row.original.avatar_url
      return (
        <div className="flex items-center space-x-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt={authorName} className="h-6 w-6 rounded-full" />
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="font-medium">{authorName}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'content',
    header: 'Content',
    cell: ({ row }) => {
      const content = row.getValue<string>('content')
      return (
        <div className="max-w-[400px] truncate" title={content}>
          {content}
        </div>
      )
    },
  },
  {
    accessorKey: 'source_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
    cell: ({ row }) => {
      const value = row.getValue<string>('source_name')
      const meta = sourceLabels[value] ?? { label: value, icon: Mail }
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
    accessorKey: 'analyzed',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const analyzed = row.getValue<boolean>('analyzed')
      return (
        <Badge variant={analyzed ? 'default' : 'outline'}>
          {analyzed ? 'Analyzed' : 'Pending'}
        </Badge>
      )
    },
    filterFn: (row, id, filterValues: string[]) => {
      if (!filterValues || filterValues.length === 0) return true
      const analyzed = row.getValue<boolean>(id)
      const status = analyzed ? 'analyzed' : 'pending'
      return filterValues.includes(status)
    },
  },
  {
    accessorKey: 'sent_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sent At" />
    ),
    cell: ({ row }) => {
      const d = row.getValue<string>('sent_at')
      return <div className="text-muted-foreground text-xs">{d ? formatFullDate(d) : '-'}</div>
    },
  },
  {
    id: 'actions',
    header: () => {
      if (callbacks?.hasActiveFilters) {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={callbacks.onReset}
            className="h-8 w-8 p-0 hover:bg-destructive/10"
          >
            <X className="h-4 w-4 text-destructive/70 hover:text-destructive" />
            <span className="sr-only">Reset filters</span>
          </Button>
        )
      }
      return null
    },
    enableHiding: false,
    cell: ({ row }) => {
      const message = row.original
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(String(message.id))}>
              Copy message ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// Legacy export for backward compatibility
export const columns = createColumns()
