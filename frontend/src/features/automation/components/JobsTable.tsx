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
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { useSchedulerJobs, useDeleteJob, useToggleJob, useTriggerJob } from '../api/automationService'
import type { SchedulerJob } from '../types'
import type { ColumnDef } from '@tanstack/react-table'
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

  const handleDelete = async (jobId: string) => {
    try {
      await deleteMutation.mutateAsync(jobId)
      toast.success('Job deleted successfully')
    } catch (error) {
      toast.error('Failed to delete job')
    }
  }

  const handleToggle = async (jobId: string) => {
    try {
      await toggleMutation.mutateAsync(jobId)
      toast.success('Job status updated')
    } catch (error) {
      toast.error('Failed to update job status')
    }
  }

  const handleTrigger = async (jobId: string) => {
    try {
      await triggerMutation.mutateAsync(jobId)
      toast.success('Job triggered successfully')
    } catch (error) {
      toast.error('Failed to trigger job')
    }
  }

  const getStatusVariant = (
    status: string
  ): 'default' | 'success' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'success':
        return 'success'
      case 'failed':
        return 'destructive'
      case 'running':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const columns: ColumnDef<SchedulerJob>[] = [
    {
      accessorKey: 'name',
      header: 'Job Name',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'schedule_cron',
      header: 'Schedule',
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">{row.original.schedule_cron}</code>
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
        />
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)}>{row.original.status}</Badge>
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
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <EllipsisVerticalIcon className="h-4 w-4" />
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
  ]

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
