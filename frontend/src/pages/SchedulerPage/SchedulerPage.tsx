import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { JobsTable } from '@/features/automation/components/JobsTable'
import { CreateEditJobDialog } from '@/features/automation/components/CreateEditJobDialog'
import type { SchedulerJob } from '@/features/automation/types'

export default function SchedulerPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<SchedulerJob | undefined>()

  const handleCreateNew = () => {
    setEditingJob(undefined)
    setIsDialogOpen(true)
  }

  const handleEdit = (job: SchedulerJob) => {
    setEditingJob(job)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingJob(undefined)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scheduled Jobs</h1>
          <p className="text-sm text-muted-foreground">
            Manage automated tasks and schedules
          </p>
        </div>
        <Button onClick={handleCreateNew}>Create Job</Button>
      </div>

      <JobsTable onEdit={handleEdit} />

      <CreateEditJobDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        job={editingJob}
      />
    </div>
  )
}
