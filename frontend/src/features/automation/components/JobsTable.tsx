import { useMemo, useCallback } from 'react'
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
      header: 'Job Name',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'schedule_cron',
      header: 'Schedule',
      cell: ({ row }) => (
        <code className="text-sm bg-muted px-2 py-2 rounded">{row.original.schedule_cron}</code>
      ),
    },
    {
      accessorKey: 'enabled',
      header: 'Enabled',
      cell: ({ row }) => (
        <Switch
          checked={row.original.enabled}
          onCheckedChange={() => handleToggle(row.original.id)}
          disabled={toggleMutation.isPending}
          aria-label={`Toggle ${row.original.name} enabled status`}
        />
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getJobStatusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: 'next_run',
      header: 'Next Run',
      cell: ({ row }) =>
        row.original.next_run ? (
          <span className="text-sm">
            In {formatDistanceToNow(new Date(row.original.next_run))}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: 'last_run',
      header: 'Last Run',
      cell: ({ row }) =>
        row.original.last_run ? (
          <span className="text-sm">
            {formatDistanceToNow(new Date(row.original.last_run), { addSuffix: true })}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Never</span>
        ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Job actions for ${row.original.name}`}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleTrigger(row.original.id)}>
              Trigger Now
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(row.original)}>Edit</DropdownMenuItem>
            )}
            {onViewHistory && (
              <DropdownMenuItem onClick={() => onViewHistory(row.original)}>
                View History
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => handleDelete(row.original.id)}
              className="text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [handleToggle, toggleMutation.isPending, handleTrigger, onEdit, onViewHistory, handleDelete])

  const table = useReactTable({
    data: jobs || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>
  }

  return <DataTable table={table} columns={columns} />
}
