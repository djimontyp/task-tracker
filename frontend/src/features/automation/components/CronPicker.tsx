import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/shared/ui/input'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { cn } from '@/shared/lib/utils'
import { FormField } from '@/shared/patterns'

interface CronPickerProps {
  value: string
  onChange: (cron: string) => void
  onValidate?: (isValid: boolean) => void
  className?: string
}

const CRON_PRESETS_CONFIG = {
  hourly: '0 * * * *',
  daily: '0 9 * * *',
  weekly: '0 9 * * 1',
  custom: '',
}

type PresetKey = keyof typeof CRON_PRESETS_CONFIG

function validateCron(cron: string): boolean {
  const cronRegex = /^(\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([12]?\d|3[01])) (\*|([1-9]|1[012])) (\*|[0-6])$/
  return cronRegex.test(cron.trim())
}

function describeCron(cron: string): string {
  if (!validateCron(cron)) {
    return 'Invalid cron expression'
  }

  const parts = cron.trim().split(' ')
  const [minute, hour, dayOfMonth, , dayOfWeek] = parts

  if (cron === '0 * * * *') return 'Runs at the start of every hour'
  if (cron === '0 9 * * *') return 'Runs every day at 9:00 AM UTC'
  if (cron === '0 9 * * 1') return 'Runs every Monday at 9:00 AM UTC'

  const hourDesc = hour === '*' ? 'every hour' : `at ${hour}:${minute.padStart(2, '0')}`
  const dayDesc =
    dayOfMonth === '*'
      ? dayOfWeek === '*'
        ? 'every day'
        : `on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(dayOfWeek)]}`
      : `on day ${dayOfMonth} of the month`

  return `Runs ${hourDesc} ${dayDesc}`
}

export function CronPicker({ value, onChange, onValidate, className }: CronPickerProps) {
  const { t } = useTranslation('settings')
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('daily')
  const [customCron, setCustomCron] = useState(value || '0 9 * * *')
  const [isValid, setIsValid] = useState(true)

  const CRON_PRESETS = {
    hourly: {
      label: t('automation.cron.presets.hourly.label'),
      description: t('automation.cron.presets.hourly.description'),
      cron: CRON_PRESETS_CONFIG.hourly,
    },
    daily: {
      label: t('automation.cron.presets.daily.label'),
      description: t('automation.cron.presets.daily.description'),
      cron: CRON_PRESETS_CONFIG.daily,
    },
    weekly: {
      label: t('automation.cron.presets.weekly.label'),
      description: t('automation.cron.presets.weekly.description'),
      cron: CRON_PRESETS_CONFIG.weekly,
    },
    custom: {
      label: t('automation.cron.presets.custom.label'),
      description: t('automation.cron.presets.custom.description'),
      cron: CRON_PRESETS_CONFIG.custom,
    },
  }

  useEffect(() => {
    const preset = Object.entries(CRON_PRESETS_CONFIG).find(
      ([, cron]) => cron === value
    )?.[0] as PresetKey | undefined

    if (preset) {
      setSelectedPreset(preset)
    } else {
      setSelectedPreset('custom')
      setCustomCron(value || '0 9 * * *')
    }
  }, [value])

  useEffect(() => {
    const valid = selectedPreset === 'custom' ? validateCron(customCron) : true
    setIsValid(valid)
    onValidate?.(valid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customCron, selectedPreset])

  const handlePresetChange = (preset: PresetKey) => {
    setSelectedPreset(preset)
    if (preset !== 'custom') {
      const cronValue = CRON_PRESETS_CONFIG[preset]
      onChange(cronValue)
      setCustomCron(cronValue)
    }
  }

  const handleCustomCronChange = (newCron: string) => {
    setCustomCron(newCron)
    if (validateCron(newCron)) {
      onChange(newCron)
    }
  }

  const currentCron = selectedPreset === 'custom' ? customCron : CRON_PRESETS_CONFIG[selectedPreset]
  const cronDescription = describeCron(currentCron)

  return (
    <div className={cn('space-y-4', className)}>
      <FormField label={t('automation.cron.scheduleFrequency')}>
        <RadioGroup value={selectedPreset} onValueChange={handlePresetChange}>
          <div className="grid gap-4">
            {Object.entries(CRON_PRESETS).map(([key, config]) => (
              <label
                key={key}
                htmlFor={key}
                className={cn(
                  'flex items-start space-x-4 rounded-lg border p-4 transition-colors cursor-pointer',
                  selectedPreset === key
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <RadioGroupItem value={key} id={key} className="mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm font-medium leading-none cursor-pointer block">
                    {config.label}
                  </span>
                  <p className="text-xs text-muted-foreground mt-2">{config.description}</p>
                </div>
              </label>
            ))}
          </div>
        </RadioGroup>
      </FormField>

      {selectedPreset === 'custom' && (
        <FormField
          label={t('automation.cron.cronExpression')}
          description="Format: minute hour day month weekday (0-6 = Sun-Sat)"
          error={!isValid ? 'Invalid cron expression' : undefined}
        >
          <Input
            value={customCron}
            onChange={(e) => handleCustomCronChange(e.target.value)}
            placeholder="0 9 * * *"
            className={cn('font-mono', !isValid && 'border-destructive')}
            aria-invalid={!isValid}
          />
        </FormField>
      )}

      <div className="rounded-lg bg-muted/50 p-4 border border-border">
        <p className={cn('text-sm', isValid ? 'text-foreground' : 'text-destructive')}>
          {isValid ? (
            <>
              <span className="font-medium">{t('automation.cron.preview')}</span>{' '}
              <span className="text-muted-foreground">{cronDescription}</span>
            </>
          ) : (
            <>
              <span className="font-medium">{t('automation.cron.error')}</span> {cronDescription}
            </>
          )}
        </p>
      </div>
    </div>
  )
}
