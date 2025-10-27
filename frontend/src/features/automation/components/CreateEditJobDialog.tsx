import { useForm, Controller } from 'react-hook-form'
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
    } catch (error) {
      toast.error(isEditing ? 'Failed to update job' : 'Failed to create job')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Job' : 'Create New Job'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Job Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Daily Knowledge Extraction"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Schedule (Cron Expression)</Label>
            <Controller
              control={control}
              name="schedule_cron"
              render={({ field }) => (
                <CronPicker value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.schedule_cron && (
              <p className="text-sm text-destructive">{errors.schedule_cron.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enable Job</Label>
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isEditing
                  ? 'Update Job'
                  : 'Create Job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
