/**
 * Create Analysis Run Modal
 */

import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Checkbox,
  Spinner,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { analysisService } from '../api/analysisService'
import { agentService } from '@/features/agents/api/agentService'
import type { CreateAnalysisRun } from '../types'
import toast from 'react-hot-toast'
import { TimeWindowSelector } from './TimeWindowSelector'

interface CreateRunModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CreateRunModal: React.FC<CreateRunModalProps> = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient()
  const [showInactive, setShowInactive] = useState(false)
  const [formData, setFormData] = useState<CreateAnalysisRun>({
    time_window_start: '',
    time_window_end: '',
    agent_assignment_id: '',
    trigger_type: 'manual',
  })

  // Fetch assignments with active filter
  const {
    data: assignments,
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useQuery({
    queryKey: ['assignments', showInactive ? 'all' : 'active'],
    queryFn: () => agentService.listAllAssignments({ active_only: !showInactive }),
    enabled: open,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateAnalysisRun) => analysisService.createRun(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-runs'] })
      toast.success('Analysis run created successfully')
      onOpenChange(false)
      setFormData({
        time_window_start: '',
        time_window_end: '',
        agent_assignment_id: '',
        trigger_type: 'manual',
      })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create analysis run')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.time_window_start || !formData.time_window_end || !formData.agent_assignment_id) {
      toast.error('Please fill in all required fields')
      return
    }
    createMutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Create Analysis Run</DialogTitle>
          <DialogDescription>
            Configure a new AI analysis run to process messages and generate task proposals
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="space-y-2">
            <Label className="text-base sm:text-sm">
              When should we analyze? *
            </Label>
            <TimeWindowSelector
              value={{
                start: formData.time_window_start,
                end: formData.time_window_end,
              }}
              onChange={({ start, end }) =>
                setFormData({ ...formData, time_window_start: start, time_window_end: end })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="agent_assignment_id" className="text-base sm:text-sm">
                Which AI should analyze these messages? *
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InformationCircleIcon
                      className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground cursor-help shrink-0"
                      aria-label="Help about agent selection"
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] sm:max-w-xs">
                    <p>Agent assignments pair an AI model with a specific task. Choose based on your analysis goal.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              Select the agent best suited for your analysis type
            </p>
            {assignmentsLoading ? (
              <div className="flex items-center justify-center p-4">
                <Spinner className="h-6 w-6" />
              </div>
            ) : assignmentsError ? (
              <div className="text-sm text-destructive">
                Failed to load assignments. Please try again.
              </div>
            ) : (
              <Select
                value={formData.agent_assignment_id || ''}
                onValueChange={(value) =>
                  setFormData({ ...formData, agent_assignment_id: value })
                }
              >
                <SelectTrigger
                  id="agent_assignment_id"
                  aria-label="Select agent assignment"
                  className="min-h-[44px]"
                >
                  <SelectValue placeholder="Select agent assignment" />
                </SelectTrigger>
                <SelectContent>
                  {assignments && assignments.length > 0 ? (
                    assignments.map((assignment) => (
                      <SelectItem
                        key={assignment.id}
                        value={assignment.id}
                        aria-label={`${assignment.agent_name}: ${assignment.task_name} (${assignment.provider_type})`}
                      >
                        <div className="flex flex-col gap-0.5 py-1 w-full">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-base md:text-sm">
                              {assignment.agent_name}
                            </span>
                            {!assignment.is_active && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground md:text-xs">
                            {assignment.task_name}
                          </span>
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            {assignment.provider_type}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No assignments available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                id="show_inactive"
                checked={showInactive}
                onCheckedChange={(checked) => setShowInactive(checked === true)}
                aria-label="Show inactive assignments"
                className="min-h-[20px] min-w-[20px]"
              />
              <Label htmlFor="show_inactive" className="text-sm font-normal cursor-pointer">
                Show inactive assignments
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="project_config_id" className="text-base sm:text-sm">
                Project settings (optional)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InformationCircleIcon
                      className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground cursor-help shrink-0"
                      aria-label="Help about project settings"
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] sm:max-w-xs">
                    <p>Leave empty to use your default project settings (keywords, filters, output format)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              Most users can leave this empty
            </p>
            <Input
              id="project_config_id"
              type="text"
              placeholder="Leave empty to use default project"
              value={formData.project_config_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, project_config_id: e.target.value || undefined })
              }
              className="min-h-[44px]"
            />
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="min-h-[44px] w-full sm:w-auto"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Run'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
