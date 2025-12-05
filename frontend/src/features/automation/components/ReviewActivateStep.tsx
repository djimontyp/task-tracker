import { useWizardStore } from '../store/wizardStore'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Clock, Settings } from 'lucide-react'

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
    approve: 'bg-semantic-success/10 text-semantic-success',
    reject: 'bg-semantic-error/10 text-semantic-error',
    manual_review: 'bg-semantic-warning/10 text-semantic-warning',
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
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-lg bg-semantic-info/10 flex items-center justify-center shrink-0">
              <Clock className="size-5 text-semantic-info" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium mb-2">Schedule</h4>
              <p className="text-sm text-muted-foreground">
                {describeCron(formData.schedule.cron_expression)}
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                {formData.schedule.cron_expression}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Settings className="size-5 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium mb-2">Automation Rules</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Action:</span>
                  <Badge className={actionColors[formData.rules.action]}>
                    {actionLabels[formData.rules.action]}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
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

      <div className="rounded-lg bg-semantic-info/10 border border-semantic-info/20 p-4">
        <h4 className="text-sm font-medium text-semantic-info mb-2">
          What happens next?
        </h4>
        <ul className="text-sm text-semantic-info/80 space-y-2">
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
