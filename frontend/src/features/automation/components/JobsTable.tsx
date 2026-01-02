import { useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Switch } from '@/shared/ui/switch'
import { DataTable } from '@/shared/components/DataTable'
import { MoreVertical } from 'lucide-react'
import { useSchedulerJobs, useDeleteJob, useToggleJob, useTriggerJob } from '../api/automationService'
import type { SchedulerJob } from '../types'
import type { ColumnDef } from '@tanstack/react-table'
import { getJobStatusVariant } from '@/shared/utils/badgeVariants'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table'

interface JobsTableProps {
  onEdit?: (job: SchedulerJob) => void
  onViewHistory?: (job: SchedulerJob) => void
}

export function JobsTable({ onEdit, onViewHistory }: JobsTableProps) {
  const { t } = useTranslation('settings')
  const { data: jobs, isLoading } = useSchedulerJobs()
  const deleteMutation = useDeleteJob()
  const toggleMutation = useToggleJob()
  const triggerMutation = useTriggerJob()

  const handleDelete = useCallback(async (jobId: string) => {
    try {
      await deleteMutation.mutateAsync(jobId)
      toast.success('Job deleted successfully')
    } catch {
      toast.error('Failed to delete job')
    }
  }, [deleteMutation])

  const handleToggle = useCallback(async (jobId: string) => {
    try {
      await toggleMutation.mutateAsync(jobId)
      toast.success('Job status updated')
    } catch {
      toast.error('Failed to update job status')
    }
  }, [toggleMutation])

  const handleTrigger = useCallback(async (jobId: string) => {
    try {
      await triggerMutation.mutateAsync(jobId)
      toast.success('Job triggered successfully')
    } catch {
      toast.error('Failed to trigger job')
    }
  }, [triggerMutation])

  const columns: ColumnDef<SchedulerJob>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: t('automation.jobs.jobName'),
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'schedule_cron',
      header: t('automation.review.schedule'),
      cell: ({ row }) => (
        <code className="text-sm bg-muted px-2 py-2 rounded">{row.original.schedule_cron}</code>
      ),
    },
    {
      accessorKey: 'enabled',
      header: t('automation.rules.enabled'),
      cell: ({ row }) => (
        <Switch
          checked={row.original.enabled}
          onCheckedChange={() => handleToggle(row.original.id)}
          disabled={toggleMutation.isPending}
          aria-label={t('automation.jobs.toggleAriaLabel', { name: row.original.name })}
        />
      ),
    },
    {
      accessorKey: 'status',
      header: t('automation.jobs.status'),
      cell: ({ row }) => (
        <Badge variant={getJobStatusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: 'next_run',
      header: t('automation.jobs.nextRun'),
      cell: ({ row }) =>
        row.original.next_run ? (
          <span className="text-sm">
            {t('automation.jobs.in')} {formatDistanceToNow(new Date(row.original.next_run))}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: 'last_run',
      header: t('automation.jobs.lastRun'),
      cell: ({ row }) =>
        row.original.last_run ? (
          <span className="text-sm">
            {formatDistanceToNow(new Date(row.original.last_run), { addSuffix: true })}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">{t('automation.jobs.never')}</span>
        ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('automation.jobs.actions')}</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t('automation.jobs.actionsAriaLabel', { name: row.original.name })}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleTrigger(row.original.id)}>
              {t('automation.jobs.triggerNow')}
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(row.original)}>{t('automation.jobs.edit')}</DropdownMenuItem>
            )}
            {onViewHistory && (
              <DropdownMenuItem onClick={() => onViewHistory(row.original)}>
                {t('automation.jobs.viewHistory')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => handleDelete(row.original.id)}
              className="text-destructive"
            >
              {t('automation.jobs.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [t, handleToggle, toggleMutation.isPending, handleTrigger, onEdit, onViewHistory, handleDelete])

  const table = useReactTable({
    data: jobs || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (isLoading) {
    return <div className="text-center py-4">{t('automation.jobs.loading')}</div>
  }

  return <DataTable table={table} columns={columns} />
}
