import { useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('settings')
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
      header: t('automation.rules.basicInfo.ruleName'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.name}</span>
          {!row.original.enabled && (
            <Badge variant="outline" className="text-xs">
              {t('automation.rules.performance.disabled')}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'priority',
      header: t('automation.rules.templates.priority').replace(':', ''),
      cell: ({ row }) => <span>{row.original.priority}</span>,
    },
    {
      accessorKey: 'action',
      header: t('automation.rules.actionLabel'),
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
      header: t('automation.rules.conditions.title'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {t('automation.rules.conditions.conditions', { count: row.original.conditions.length })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('automation.jobs.actions')}</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t('automation.rules.performance.actionsAriaLabel', { name: row.original.name })}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(row.original)}>{t('automation.common.edit')}</DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => handleDelete(row.original.id)}
              className="text-destructive"
            >
              {t('automation.common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [t, onEdit, handleDelete])

  const table = useReactTable({
    data: rules || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (isLoading) {
    return <div className="text-center py-4">{t('automation.common.loading')}</div>
  }

  return <DataTable table={table} columns={columns} />
}
