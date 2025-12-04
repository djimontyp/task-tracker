import { useWizardStore } from '../store/wizardStore'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { ClockIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

function describeCron(cron: string): string {
  if (cron === '0 * * * *') return 'Every hour'
  if (cron === '0 9 * * *') return 'Daily at 9:00 AM UTC'
  if (cron === '0 9 * * 1') return 'Weekly on Mondays at 9:00 AM UTC'
  return cron
}

export function ReviewActivateStep() {
  const { formData } = useWizardStore()

  const actionLabels = {
    approve: 'Auto-Approve',
    reject: 'Auto-Reject',
    manual_review: 'Manual Review',
  }

  const actionColors = {
    approve: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    reject: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
    manual_review: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review & Activate</h3>
        <p className="text-sm text-muted-foreground">
          Review your automation configuration before activation
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
              <ClockIcon className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium mb-1">Schedule</h4>
              <p className="text-sm text-muted-foreground">
                {describeCron(formData.schedule.cron_expression)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {formData.schedule.cron_expression}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-lg bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center shrink-0">
              <Cog6ToothIcon className="size-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium mb-1">Automation Rules</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Action:</span>
                  <Badge className={actionColors[formData.rules.action]}>
                    {actionLabels[formData.rules.action]}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Confidence:</span>{' '}
                    <span className="font-mono font-medium">
                      ≥{formData.rules.confidence_threshold}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Similarity:</span>{' '}
                    <span className="font-mono font-medium">
                      ≥{formData.rules.similarity_threshold}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

      </div>

      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          What happens next?
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <li className="flex items-start gap-2">
            <span className="shrink-0">1.</span>
            <span>Scheduler job will be created with your configured schedule</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0">2.</span>
            <span>Automation rule will be created with your thresholds</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0">3.</span>
            <span>
              You can monitor and adjust everything from the Automation Dashboard
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
