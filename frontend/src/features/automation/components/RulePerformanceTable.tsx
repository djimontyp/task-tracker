import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { DataTable } from '@/shared/components/DataTable'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { useAutomationRules, useDeleteRule } from '../api/automationService'
import type { AutomationRule } from '../types'
import type { ColumnDef } from '@tanstack/react-table'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table'

interface RulePerformanceTableProps {
  onEdit?: (rule: AutomationRule) => void
}

export function RulePerformanceTable({ onEdit }: RulePerformanceTableProps) {
  const { data: rules, isLoading } = useAutomationRules()
  const deleteMutation = useDeleteRule()

  const handleDelete = async (ruleId: string) => {
    try {
      await deleteMutation.mutateAsync(ruleId)
      toast.success('Rule deleted successfully')
    } catch (error) {
      toast.error('Failed to delete rule')
    }
  }

  const getActionVariant = (
    action: string
  ): 'default' | 'secondary' | 'success' | 'destructive' => {
    switch (action) {
      case 'approve':
        return 'success'
      case 'reject':
        return 'destructive'
      case 'escalate':
        return 'secondary'
      case 'notify':
        return 'default'
      default:
        return 'default'
    }
  }

  const columns: ColumnDef<AutomationRule>[] = [
    {
      accessorKey: 'name',
      header: 'Rule Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.name}</span>
          {!row.original.enabled && (
            <Badge variant="outline" className="text-xs">
              Disabled
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => <span>{row.original.priority}</span>,
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <Badge variant={getActionVariant(row.original.action)}>{row.original.action}</Badge>
      ),
    },
    {
      accessorKey: 'triggered_count',
      header: 'Triggered',
      cell: ({ row }) => <span>{row.original.triggered_count || 0}</span>,
    },
    {
      id: 'success_rate',
      header: 'Success Rate',
      cell: ({ row }) => {
        const rate = row.original.success_rate || 0
        return <span>{rate.toFixed(1)}%</span>
      },
    },
    {
      accessorKey: 'conditions',
      header: 'Conditions',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.conditions.length} condition{row.original.conditions.length !== 1 ? 's' : ''}
        </span>
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
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(row.original)}>Edit</DropdownMenuItem>
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
    data: rules || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>
  }

  return <DataTable table={table} columns={columns} />
}
