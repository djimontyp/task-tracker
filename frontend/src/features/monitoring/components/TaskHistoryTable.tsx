import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { TaskHistoryResponse, HistoryFilters, TaskStatus } from '../types'

interface TaskHistoryTableProps {
  history: TaskHistoryResponse
  onFilterChange: (filters: HistoryFilters) => void
  onPageChange: (page: number) => void
  availableTaskNames?: string[]
}

export const TaskHistoryTable = ({
  history,
  onFilterChange,
  onPageChange,
  availableTaskNames = [],
}: TaskHistoryTableProps) => {
  const { t } = useTranslation('taskMonitoring')
  const [filters, setFilters] = useState<HistoryFilters>({})
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const handleFilterChange = (key: keyof HistoryFilters, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value === 'all' ? undefined : value,
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= history.total_pages) {
      onPageChange(newPage)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sections.taskHistory')}</CardTitle>
        <div className="flex flex-wrap gap-4 pt-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">{t('history.filters.taskType')}</label>
            <Select
              value={filters.task_name ?? 'all'}
              onValueChange={(value) => handleFilterChange('task_name', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('history.filters.allTasks')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('history.filters.allTasks')}</SelectItem>
                {availableTaskNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {formatTaskName(name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium mb-2 block">{t('history.filters.status')}</label>
            <Select
              value={filters.status ?? 'all'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('history.filters.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('history.filters.allStatuses')}</SelectItem>
                <SelectItem value="pending">{t('statuses.pending')}</SelectItem>
                <SelectItem value="running">{t('statuses.running')}</SelectItem>
                <SelectItem value="success">{t('statuses.success')}</SelectItem>
                <SelectItem value="failed">{t('statuses.failed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('history.table.task')}</TableHead>
              <TableHead>{t('history.table.status')}</TableHead>
              <TableHead>{t('history.table.startTime')}</TableHead>
              <TableHead>{t('history.table.duration')}</TableHead>
              <TableHead>{t('history.table.error')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t('history.table.noRecords')}
                </TableCell>
              </TableRow>
            ) : (
              history.items.map((log) => (
                <>
                  <TableRow
                    key={log.id}
                    className="cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                  >
                    <TableCell className="font-medium">
                      {formatTaskName(log.task_name)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(log.status)}>
                        {t(`statuses.${log.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.started_at ? formatTimestamp(log.started_at) : '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.duration_ms !== null ? formatDuration(log.duration_ms) : '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.error_message ? (
                        <span className="text-semantic-error truncate max-w-[300px] block" title={log.error_message}>
                          {log.error_message}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedRow === log.id && log.error_traceback && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-muted/50">
                        <div className="p-4">
                          <h4 className="font-semibold mb-2">{t('history.details.errorDetails')}</h4>
                          <pre className="text-xs overflow-x-auto bg-background p-4 rounded-md border">
                            {log.error_traceback}
                          </pre>
                          {log.params && (
                            <>
                              <h4 className="font-semibold mt-4 mb-2">{t('history.details.parameters')}</h4>
                              <pre className="text-xs overflow-x-auto bg-background p-4 rounded-md border">
                                {JSON.stringify(log.params, null, 2)}
                              </pre>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>

        {history.total_pages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {t('history.pagination.page', {
                current: history.page,
                total: history.total_pages,
                count: history.total_count,
              })}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(history.page - 1)}
                disabled={history.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                {t('history.pagination.back')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(history.page + 1)}
                disabled={history.page === history.total_pages}
              >
                {t('history.pagination.next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getStatusVariant(status: TaskStatus): 'default' | 'secondary' | 'success' | 'destructive' {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'destructive'
    case 'running':
      return 'default'
    case 'pending':
      return 'secondary'
    default:
      return 'secondary'
  }
}


function formatTaskName(taskName: string): string {
  return taskName
    .replace(/_task$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString('uk-UA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}
