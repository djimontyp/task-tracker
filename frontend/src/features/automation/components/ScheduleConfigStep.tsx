import { useTranslation } from 'react-i18next'
import { useWizardStore } from '../store/wizardStore'
import { CronPicker } from './CronPicker'

export function ScheduleConfigStep() {
  const { t } = useTranslation('settings')
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
        <h3 className="text-lg font-semibold mb-2">{t('automation.schedule.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('automation.schedule.description')}
        </p>
      </div>

      <CronPicker
        value={formData.schedule.cron_expression}
        onChange={handleCronChange}
        onValidate={handleValidate}
      />

      <div className="rounded-lg bg-semantic-info/10 border border-semantic-info/20 p-4">
        <h4 className="text-sm font-medium text-semantic-info mb-2">
          {t('automation.schedule.whatHappens.title')}
        </h4>
        <ul className="text-sm text-semantic-info/80 space-y-2 list-disc list-inside">
          <li>{t('automation.schedule.whatHappens.fetchPending')}</li>
          <li>{t('automation.schedule.whatHappens.applyRules')}</li>
          <li>{t('automation.schedule.whatHappens.autoAction')}</li>
          <li>{t('automation.schedule.whatHappens.sendNotifications')}</li>
        </ul>
      </div>
    </div>
  )
}
