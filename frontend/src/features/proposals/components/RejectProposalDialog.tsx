/**
 * Reject Proposal Dialog
 */

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Textarea,
} from '@/shared/ui'

interface RejectProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  isLoading?: boolean
}

export const RejectProposalDialog: React.FC<RejectProposalDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}) => {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    if (!reason.trim()) {
      return
    }
    onConfirm(reason)
    setReason('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reject Proposal</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this proposal. This will help improve future AI
            suggestions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reason">Rejection Reason *</Label>
          <Textarea
            id="reason"
            placeholder="e.g., Duplicate task, incorrect category, missing details..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            required
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? 'Rejecting...' : 'Reject Proposal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
