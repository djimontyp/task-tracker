import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
import { FormField } from '@/shared/patterns'
import { CronPicker } from './CronPicker'
import { useCreateJob, useUpdateJob } from '../api/automationService'
import type { SchedulerJob } from '../types'

const jobFormSchema = z.object({
  name: z.string().min(1, 'Job name is required'),
  schedule_cron: z.string().min(1, 'Schedule is required'),
  enabled: z.boolean(),
})

type JobFormData = z.infer<typeof jobFormSchema>

interface CreateEditJobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job?: SchedulerJob
}

export function CreateEditJobDialog({ open, onOpenChange, job }: CreateEditJobDialogProps) {
  const { t } = useTranslation('settings')
  const isEditing = !!job

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      name: job?.name || '',
      schedule_cron: job?.schedule_cron || '0 9 * * *',
      enabled: job?.enabled ?? true,
    },
  })

  const createMutation = useCreateJob()
  const updateMutation = useUpdateJob()

  const onSubmit = async (data: JobFormData) => {
    try {
      if (isEditing && job) {
        await updateMutation.mutateAsync({
          jobId: job.id,
          data: {
            name: data.name,
            schedule_cron: data.schedule_cron,
            enabled: data.enabled,
          },
        })
        toast.success('Job updated successfully')
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          schedule_cron: data.schedule_cron,
          enabled: data.enabled,
        })
        toast.success('Job created successfully')
      }
      onOpenChange(false)
    } catch {
      toast.error(isEditing ? 'Failed to update job' : 'Failed to create job')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] md:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('automation.jobs.dialogTitle.edit') : t('automation.jobs.dialogTitle.create')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField label={t('automation.jobs.jobName')} error={errors.name?.message}>
            <Input
              id="name"
              {...register('name')}
              placeholder={t('automation.jobs.jobNamePlaceholder')}
            />
          </FormField>

          <FormField label={t('automation.jobs.scheduleCron')} error={errors.schedule_cron?.message}>
            <Controller
              control={control}
              name="schedule_cron"
              render={({ field }) => (
                <CronPicker value={field.value} onChange={field.onChange} />
              )}
            />
          </FormField>

          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">{t('automation.jobs.enableJob')}</Label>
            <Controller
              control={control}
              name="enabled"
              render={({ field }) => (
                <Switch id="enabled" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('automation.jobs.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? t('automation.jobs.saving')
                : isEditing
                  ? t('automation.jobs.updateJob')
                  : t('automation.jobs.createJob')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
