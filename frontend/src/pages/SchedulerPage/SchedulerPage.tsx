import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { PageWrapper } from '@/shared/primitives'
import { JobsTable } from '@/features/automation/components/JobsTable'
import { CreateEditJobDialog } from '@/features/automation/components/CreateEditJobDialog'
import type { SchedulerJob } from '@/features/automation/types'

export default function SchedulerPage() {
  const { t } = useTranslation('automation')
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
    <PageWrapper variant="fullWidth" className="p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('scheduler.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('scheduler.description')}
          </p>
        </div>
        <Button onClick={handleCreateNew}>{t('scheduler.createJob')}</Button>
      </div>

      <JobsTable onEdit={handleEdit} />

      <CreateEditJobDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        job={editingJob}
      />
    </PageWrapper>
  )
}
