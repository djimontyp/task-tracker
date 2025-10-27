import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useSchedulerJobs, useTriggerJob } from '../api/automationService'

export function JobStatusWidget() {
  const { data: jobs, isLoading } = useSchedulerJobs()
  const triggerMutation = useTriggerJob()

  const mainJob = jobs?.[0]

  const handleTriggerNow = async () => {
    if (!mainJob) return

    try {
      await triggerMutation.mutateAsync(mainJob.id)
      toast.success('Job triggered successfully')
    } catch (error) {
      toast.error('Failed to trigger job')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scheduler Status</CardTitle>
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
          <CardTitle className="text-base">Scheduler Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No scheduled jobs configured</div>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = () => {
    switch (mainJob.status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      case 'running':
        return <ClockIcon className="h-5 w-5 text-blue-600 animate-spin" />
      default:
        return <ClockIcon className="h-5 w-5 text-muted-foreground" />
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
        <CardTitle className="text-base">Scheduler Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Run</span>
            <span className="text-sm font-medium">
              {mainJob.last_run
                ? formatDistanceToNow(new Date(mainJob.last_run), { addSuffix: true })
                : 'Never'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Next Run</span>
            <span className="text-sm font-medium">
              {mainJob.next_run
                ? `In ${formatDistanceToNow(new Date(mainJob.next_run))}`
                : 'Not scheduled'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge variant={getStatusBadgeVariant()}>{mainJob.status}</Badge>
            </div>
          </div>
        </div>

        {mainJob.error_message && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
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
