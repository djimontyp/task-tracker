import { useWizardStore } from '../store/wizardStore'
import { CronPicker } from './CronPicker'

export function ScheduleConfigStep() {
  const { formData, updateSchedule, setStepValidity } = useWizardStore()

  const handleCronChange = (cron: string) => {
    const preset = cron === '0 * * * *'
      ? 'hourly'
      : cron === '0 9 * * *'
      ? 'daily'
      : cron === '0 9 * * 1'
      ? 'weekly'
      : 'custom'

    updateSchedule({
      preset,
      cron_expression: cron,
    })
  }

  const handleValidate = (isValid: boolean) => {
    setStepValidity('schedule', isValid)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Configure Schedule</h3>
        <p className="text-sm text-muted-foreground">
          Set up when automated analysis should run to process pending versions
        </p>
      </div>

      <CronPicker
        value={formData.schedule.cron_expression}
        onChange={handleCronChange}
        onValidate={handleValidate}
      />

      <div className="rounded-lg bg-semantic-info/10 border border-semantic-info/20 p-4">
        <h4 className="text-sm font-medium text-semantic-info mb-2">
          What happens when the job runs?
        </h4>
        <ul className="text-sm text-semantic-info/80 space-y-2 list-disc list-inside">
          <li>Fetches all pending topic/atom versions</li>
          <li>Applies automation rules to each version</li>
          <li>Auto-approves/rejects based on configured thresholds</li>
          <li>Sends notifications if enabled</li>
        </ul>
      </div>
    </div>
  )
}
