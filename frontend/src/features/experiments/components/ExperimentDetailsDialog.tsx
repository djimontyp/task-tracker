/**
 * ExperimentDetailsDialog Component
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  Spinner,
} from '@/shared/ui'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useExperimentDetails } from '../api/experimentService'
import ConfusionMatrixHeatmap from './ConfusionMatrixHeatmap'
import type { ClassificationResult } from '../types'

interface ExperimentDetailsDialogProps {
  experimentId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ExperimentDetailsDialog = ({
  experimentId,
  open,
  onOpenChange,
}: ExperimentDetailsDialogProps) => {
  const [filterCorrect, setFilterCorrect] = useState<string>('all')

  const { data: experiment, isLoading } = useExperimentDetails(experimentId || 0)

  const filteredResults = experiment?.classification_results?.filter((result) => {
    if (filterCorrect === 'all') return true
    const isCorrect = result.actual_topic_id === result.predicted_topic_id
    return filterCorrect === 'correct' ? isCorrect : !isCorrect
  }) ?? []

  const formatTime = (ms: number) => `${ms.toFixed(0)}ms`

  const renderResult = (result: ClassificationResult) => {
    const isCorrect = result.actual_topic_id === result.predicted_topic_id

    return (
      <Card
        key={result.message_id}
        className={`p-4 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground truncate">
                Message #{result.message_id}
              </p>
              <p className="text-sm mt-1 line-clamp-2">{result.message_content}</p>
            </div>
            <Badge variant={isCorrect ? 'success' : 'destructive'}>
              {isCorrect ? 'Correct' : 'Incorrect'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Actual topic:</span>
              <p className="font-medium">
                {result.actual_topic_name || 'Unknown'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Predicted topic:</span>
              <p className="font-medium">{result.predicted_topic_name}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Confidence:</span>
              <span className="ml-2 font-medium">
                {(result.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Time:</span>
              <span className="ml-2 font-mono">{formatTime(result.execution_time_ms)}</span>
            </div>
          </div>

          {result.reasoning && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Reasoning
              </summary>
              <p className="mt-2 text-xs bg-muted p-2 rounded">{result.reasoning}</p>
            </details>
          )}

          {result.alternatives && result.alternatives.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Alternatives ({result.alternatives.length})
              </summary>
              <div className="mt-2 space-y-1">
                {result.alternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between text-xs bg-muted p-2 rounded"
                  >
                    <span>{alt.topic_name}</span>
                    <span className="font-mono">{(alt.confidence * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Experiment Details</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : !experiment ? (
          <div className="text-center text-muted-foreground py-12">
            Experiment not found
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Accuracy</div>
                <div className="text-2xl font-bold">
                  {experiment.accuracy !== null
                    ? `${(experiment.accuracy * 100).toFixed(1)}%`
                    : '—'}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Avg Confidence</div>
                <div className="text-2xl font-bold">
                  {experiment.avg_confidence !== null
                    ? `${(experiment.avg_confidence * 100).toFixed(1)}%`
                    : '—'}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Avg Time</div>
                <div className="text-2xl font-bold">
                  {experiment.avg_execution_time_ms !== null
                    ? formatTime(experiment.avg_execution_time_ms)
                    : '—'}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Messages</div>
                <div className="text-2xl font-bold">{experiment.message_count}</div>
              </Card>
            </div>

            <Tabs defaultValue="matrix" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="matrix">Confusion Matrix</TabsTrigger>
                <TabsTrigger value="results">
                  Results ({filteredResults.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="matrix" className="space-y-4">
                <ConfusionMatrixHeatmap matrix={experiment.confusion_matrix} />
              </TabsContent>

              <TabsContent value="results" className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Filter:</span>
                  <Select value={filterCorrect} onValueChange={setFilterCorrect}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All results</SelectItem>
                      <SelectItem value="correct">Correct only</SelectItem>
                      <SelectItem value="incorrect">Incorrect only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredResults.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No results for this filter
                  </div>
                ) : (
                  <div className="space-y-3">{filteredResults.map(renderResult)}</div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ExperimentDetailsDialog
