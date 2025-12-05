import { useMemo, useCallback } from 'react'
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
import { MoreVertical } from 'lucide-react'
import { useAutomationRules, useDeleteRule } from '../api/automationService'
import type { AutomationRule } from '../types'
import type { ColumnDef } from '@tanstack/react-table'
import { getRuleActionVariant } from '@/shared/utils/badgeVariants'
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

  const handleDelete = useCallback(async (ruleId: string) => {
    try {
      await deleteMutation.mutateAsync(ruleId)
      toast.success('Rule deleted successfully')
    } catch {
      toast.error('Failed to delete rule')
    }
  }, [deleteMutation])

  const columns: ColumnDef<AutomationRule>[] = useMemo(() => [
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
        <Badge variant={getRuleActionVariant(row.original.action)}>{row.original.action}</Badge>
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
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Rule actions for ${row.original.name}`}>
              <MoreVertical className="h-4 w-4" />
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
  ], [onEdit, handleDelete])

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
