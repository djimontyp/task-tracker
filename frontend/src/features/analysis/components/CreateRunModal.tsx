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
} from '@/shared/ui'
import { analysisService } from '../api/analysisService'
import { agentService } from '@/features/agents/api/agentService'
import type { CreateAnalysisRun } from '../types'
import toast from 'react-hot-toast'

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Analysis Run</DialogTitle>
          <DialogDescription>
            Configure a new AI analysis run to process messages and generate task proposals
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="time_window_start">Time Window Start *</Label>
            <Input
              id="time_window_start"
              type="datetime-local"
              value={formData.time_window_start}
              onChange={(e) =>
                setFormData({ ...formData, time_window_start: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time_window_end">Time Window End *</Label>
            <Input
              id="time_window_end"
              type="datetime-local"
              value={formData.time_window_end}
              onChange={(e) =>
                setFormData({ ...formData, time_window_end: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent_assignment_id">Agent Assignment *</Label>
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
                <SelectTrigger id="agent_assignment_id" aria-label="Select agent assignment">
                  <SelectValue placeholder="Select agent assignment" />
                </SelectTrigger>
                <SelectContent>
                  {assignments && assignments.length > 0 ? (
                    assignments.map((assignment) => (
                      <SelectItem key={assignment.id} value={assignment.id}>
                        <div className="flex items-center gap-2">
                          <span>
                            Agent: {assignment.agent_name} | Task: {assignment.task_name} (
                            {assignment.provider_type})
                          </span>
                          {!assignment.is_active && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Inactive
                            </Badge>
                          )}
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
              />
              <Label htmlFor="show_inactive" className="text-sm font-normal cursor-pointer">
                Show inactive assignments
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_config_id">Project Config ID (Optional)</Label>
            <Input
              id="project_config_id"
              type="text"
              placeholder="Leave empty to use default project"
              value={formData.project_config_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, project_config_id: e.target.value || undefined })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Run'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
