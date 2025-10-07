import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, ArrowUpDown, Mail, User } from 'lucide-react'

import { Checkbox, Button, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/shared/ui'

export interface Message {
  id: number
  external_message_id: string
  content: string
  author: string
  sent_at: string
  source_name: string
  analyzed: boolean
  avatar_url?: string | null
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

export const columns: ColumnDef<Message>[] = [
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
    accessorKey: 'author',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="hover:bg-accent/10 hover:text-accent-foreground data-[state=open]:bg-accent/10"
      >
        Author
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const author = row.getValue<string>('author')
      const avatarUrl = row.original.avatar_url
      return (
        <div className="flex items-center space-x-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt={author} className="h-6 w-6 rounded-full" />
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="font-medium">{author}</span>
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
    header: 'Source',
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
    header: 'Status',
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
    header: 'Sent At',
    cell: ({ row }) => {
      const d = row.getValue<string>('sent_at')
      return <div className="text-muted-foreground text-xs">{d ? new Date(d).toLocaleString() : '-'}</div>
    },
  },
  {
    id: 'actions',
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
