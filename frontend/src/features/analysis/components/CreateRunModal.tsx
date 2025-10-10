/**
 * Create Analysis Run Modal
 */

import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
} from '@/shared/ui'
import { analysisService } from '../api/analysisService'
import type { CreateAnalysisRun } from '../types'
import toast from 'react-hot-toast'

interface CreateRunModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CreateRunModal: React.FC<CreateRunModalProps> = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<CreateAnalysisRun>({
    time_window_start: '',
    time_window_end: '',
    trigger_type: 'manual',
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
            <Label htmlFor="agent_assignment_id">Agent Assignment ID *</Label>
            <Input
              id="agent_assignment_id"
              type="text"
              placeholder="Enter agent assignment UUID"
              value={formData.agent_assignment_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, agent_assignment_id: e.target.value })
              }
              required
            />
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
