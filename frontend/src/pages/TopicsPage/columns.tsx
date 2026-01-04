import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Database, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Task } from '@/shared/types'
import { Checkbox, Button, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/shared/ui'
import { DataTableColumnHeader } from '@/shared/components/DataTableColumnHeader'
import { getTaskStatusBadge, getTaskPriorityBadge, type TaskStatus, type TaskPriority } from '@/shared/utils/statusBadges'

export const statusIconConfig: Record<string, { icon: React.ComponentType<{ className?: string }> }> = {
  open: { icon: Clock },
  in_progress: { icon: Database },
  completed: { icon: CheckCircle },
  closed: { icon: XCircle },
  pending: { icon: Clock },
}

type TFunction = ReturnType<typeof useTranslation<'topics'>>['t']
type TCommonFunction = ReturnType<typeof useTranslation>['t']

export const createColumns = (t: TFunction, tCommon?: TCommonFunction): ColumnDef<Task>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label={t('table.selectAll')}
      />
    ),
    cell: ({ row }) => (
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label={t('table.selectRow')} />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 28,
  },
  {
    accessorKey: 'id',
    header: t('table.task'),
    cell: ({ row }) => {
      const id = row.getValue<number | string>('id')
      const prefix = tCommon ? tCommon('labels.taskPrefix') : 'TASK-'
      return <div className="w-[80px] text-xs font-medium text-muted-foreground">{prefix}{String(id).padStart(4, '0')}</div>
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('table.title')} />
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
      <DataTableColumnHeader column={column} title={t('table.status')} />
    ),
    cell: ({ row }) => {
      const status = row.getValue<string>('status') as TaskStatus
      const badgeConfig = getTaskStatusBadge(status)
      const iconMeta = statusIconConfig[status] ?? statusIconConfig.pending
      const Icon = iconMeta.icon
      return (
        <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
          {Icon && <Icon className="mr-2 h-3 w-3" />}
          {badgeConfig.label}
        </Badge>
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
      <DataTableColumnHeader column={column} title={t('table.priority')} />
    ),
    cell: ({ row }) => {
      const priority = row.getValue<string>('priority') as TaskPriority
      const badgeConfig = getTaskPriorityBadge(priority)
      return (
        <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
          {badgeConfig.label}
        </Badge>
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
      <DataTableColumnHeader column={column} title={t('table.created')} />
    ),
    cell: ({ row }) => {
      const d = row.getValue<string>('created_at') || (row.original as Task).createdAt
      return <div className="text-muted-foreground text-xs">{d ? new Date(d).toLocaleDateString() : '-'}</div>
    },
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">{t('table.actions')}</span>,
    enableHiding: false,
    cell: ({ row }) => {
      const task = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-11 w-11 p-0" aria-label={t('table.taskActionsFor', { title: task.title || `Task ${task.id}` })}>
              <span className="sr-only">{t('table.openMenu')}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('table.actions')}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(String(task.id))}>
              {t('table.copyTaskId')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('table.view')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

/** @deprecated Use createColumns(t) instead for i18n support */
export const columns: ColumnDef<Task>[] = createColumns(((key: string) => key) as unknown as TFunction)
