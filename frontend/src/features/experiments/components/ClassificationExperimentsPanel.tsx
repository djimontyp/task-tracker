/**
 * ClassificationExperimentsPanel Component
 */

import { useState, useEffect } from 'react'
import { Button, Card, Spinner } from '@/shared/ui'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useExperiments, useStartExperiment, useDeleteExperiment } from '../api/experimentService'
import ExperimentsList from './ExperimentsList'
import StartExperimentDialog from './StartExperimentDialog'
import ExperimentDetailsDialog from './ExperimentDetailsDialog'
import { toast } from 'sonner'
import { useWebSocket } from '@/features/websocket/hooks/useWebSocket'
import type { ExperimentCreate, ExperimentWebSocketEvent } from '../types'

const ClassificationExperimentsPanel = () => {
  const [startDialogOpen, setStartDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedExperimentId, setSelectedExperimentId] = useState<number | null>(null)

  const { data, isLoading, error, refetch } = useExperiments()

  const startMutation = useStartExperiment()
  const deleteMutation = useDeleteExperiment()

  const handleWebSocketMessage = (data: unknown) => {
    const event = data as ExperimentWebSocketEvent

    const experimentEventTypes = [
      'experiment_started',
      'experiment_progress',
      'experiment_completed',
      'experiment_failed',
    ]

    if (!experimentEventTypes.includes(event.type)) return

    if (event.type === 'experiment_started') {
      toast.info(`Experiment #${event.experiment_id} started`)
      refetch()
    } else if (event.type === 'experiment_progress') {
      toast.loading(
        `Experiment #${event.experiment_id}: ${event.percentage?.toFixed(0)}% (${event.current}/${event.total})`,
        { id: `exp-${event.experiment_id}` }
      )
    } else if (event.type === 'experiment_completed') {
      toast.success(
        `Experiment #${event.experiment_id} completed. Accuracy: ${(event.accuracy! * 100).toFixed(1)}%`,
        { id: `exp-${event.experiment_id}` }
      )
      refetch()
    } else if (event.type === 'experiment_failed') {
      toast.error(
        `Experiment #${event.experiment_id} failed: ${event.error}`,
        { id: `exp-${event.experiment_id}` }
      )
      refetch()
    }
  }

  useWebSocket({
    onMessage: handleWebSocketMessage,
  })

  useEffect(() => {
    if (!startDialogOpen && !detailsDialogOpen) {
      refetch()
    }
  }, [startDialogOpen, detailsDialogOpen, refetch])

  const handleStartExperiment = async (data: ExperimentCreate) => {
    try {
      await startMutation.mutateAsync(data)
      toast.success('Experiment started')
      setStartDialogOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to start experiment'
      )
    }
  }

  const handleViewDetails = (id: number) => {
    setSelectedExperimentId(id)
    setDetailsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this experiment?')) return

    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Experiment deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete experiment')
    }
  }

  if (error) {
    return (
      <Card className="p-6 border-destructive">
        <div className="flex items-start gap-3">
          <div className="text-destructive text-lg">⚠️</div>
          <div>
            <p className="font-semibold text-destructive mb-1">Error loading data</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const experiments = data?.items ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Topic Classification Experiments</h2>
          <p className="text-muted-foreground">
            Test models on message classification by topics
          </p>
        </div>
        <Button onClick={() => setStartDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Experiment
        </Button>
      </div>

      {isLoading ? (
        <Card className="flex items-center justify-center p-12">
          <Spinner size="lg" />
        </Card>
      ) : experiments.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">No experiments yet</p>
            <p className="text-sm">
              Click &quot;New Experiment&quot; to start testing a model
            </p>
          </div>
        </Card>
      ) : (
        <ExperimentsList
          experiments={experiments}
          onViewDetails={handleViewDetails}
          onDelete={handleDelete}
          isDeleting={deleteMutation.isPending}
        />
      )}

      <StartExperimentDialog
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
        onSubmit={handleStartExperiment}
        isLoading={startMutation.isPending}
      />

      <ExperimentDetailsDialog
        experimentId={selectedExperimentId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </div>
  )
}

export default ClassificationExperimentsPanel
