import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { useSchedulerJobs, useTriggerJob } from '../api/automationService'

export function JobStatusWidget() {
  const { t } = useTranslation('settings')
  const { data: jobs, isLoading } = useSchedulerJobs()
  const triggerMutation = useTriggerJob()

  const mainJob = jobs?.[0]

  const handleTriggerNow = async () => {
    if (!mainJob) return

    try {
      await triggerMutation.mutateAsync(mainJob.id)
      toast.success('Job triggered successfully')
    } catch {
      toast.error('Failed to trigger job')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('automation.jobs.schedulerStatus')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!mainJob) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('automation.jobs.schedulerStatus')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">{t('automation.jobs.noJobsConfigured')}</div>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = () => {
    switch (mainJob.status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-semantic-success" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-semantic-error" />
      case 'running':
        return <Clock className="h-5 w-5 text-semantic-info animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusBadgeVariant = (): 'default' | 'success' | 'destructive' | 'secondary' => {
    switch (mainJob.status) {
      case 'success':
        return 'success'
      case 'failed':
        return 'destructive'
      case 'running':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('automation.jobs.schedulerStatus')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('automation.jobs.lastRun')}</span>
            <span className="text-sm font-medium">
              {mainJob.last_run
                ? formatDistanceToNow(new Date(mainJob.last_run), { addSuffix: true })
                : t('automation.jobs.never')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('automation.jobs.nextRun')}</span>
            <span className="text-sm font-medium">
              {mainJob.next_run
                ? `${t('automation.jobs.in')} ${formatDistanceToNow(new Date(mainJob.next_run))}`
                : t('automation.jobs.notScheduled')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('automation.jobs.status')}</span>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge variant={getStatusBadgeVariant()}>{mainJob.status}</Badge>
            </div>
          </div>
        </div>

        {mainJob.error_message && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-xs text-destructive">{mainJob.error_message}</p>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={handleTriggerNow}
          disabled={triggerMutation.isPending || mainJob.status === 'running'}
        >
          {triggerMutation.isPending ? 'Triggering...' : 'Trigger Now'}
        </Button>
      </CardContent>
    </Card>
  )
}
