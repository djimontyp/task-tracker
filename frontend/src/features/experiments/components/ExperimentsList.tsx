/**
 * ExperimentsList Component
 */

import { useMemo } from 'react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
} from '@/shared/ui'
import { TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import type { ExperimentPublic } from '../types'
import { useProviders } from '../api/experimentService'

interface ExperimentsListProps {
  experiments: ExperimentPublic[]
  onViewDetails: (id: number) => void
  onDelete: (id: number) => void
  isDeleting?: boolean
}

const ExperimentsList = ({
  experiments,
  onViewDetails,
  onDelete,
  isDeleting,
}: ExperimentsListProps) => {
  const { data: providers, isLoading: isLoadingProviders } = useProviders()

  const providerMap = useMemo(() => {
    if (!providers) return new Map<string, string>()
    return new Map(providers.map(p => [p.id, p.name]))
  }, [providers])

  const getProviderName = (providerId: string) => {
    if (isLoadingProviders) return '...'
    const name = providerMap.get(providerId)
    if (name) return name
    return providerId.slice(0, 8) + '...'
  }

  const getStatusBadge = (status: ExperimentPublic['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      completed: 'success',
      failed: 'destructive',
    } as const

    return (
      <Badge variant={variants[status]}>
        {status}
      </Badge>
    )
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    try {
      return format(new Date(dateStr), 'dd.MM.yyyy HH:mm')
    } catch {
      return dateStr
    }
  }

  const formatAccuracy = (accuracy: number | null) => {
    if (accuracy === null) return '—'
    return `${(accuracy * 100).toFixed(1)}%`
  }

  const formatTime = (ms: number | null) => {
    if (ms === null || ms === 0) return '—'
    return `${ms.toFixed(0)}ms`
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Date</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Model</TableHead>
            <TableHead className="text-center">Messages</TableHead>
            <TableHead className="text-center">Accuracy</TableHead>
            <TableHead className="text-center">Avg Time</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {experiments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                No experiments found
              </TableCell>
            </TableRow>
          ) : (
            experiments.map((experiment) => (
              <TableRow key={experiment.id}>
                <TableCell className="font-mono text-sm">
                  {formatDate(experiment.created_at)}
                </TableCell>
                <TableCell className="font-medium">
                  {getProviderName(experiment.provider_id)}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {experiment.model_name}
                </TableCell>
                <TableCell className="text-center">
                  {experiment.message_count}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {formatAccuracy(experiment.accuracy)}
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  {formatTime(experiment.avg_execution_time_ms)}
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(experiment.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(experiment.id)}
                      disabled={experiment.status !== 'completed'}
                      aria-label="View details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(experiment.id)}
                      disabled={isDeleting}
                      aria-label="Delete experiment"
                    >
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default ExperimentsList
