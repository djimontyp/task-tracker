import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { cn } from '@/shared/lib'
import { FormField } from '@/shared/patterns'

interface TimeWindowSelectorProps {
  value: {
    start: string
    end: string
  }
  onChange: (value: { start: string; end: string }) => void
}

type PresetType = 'last24h' | 'last7d' | 'last30d' | 'custom'

const PRESETS: { type: PresetType; hours?: number }[] = [
  { type: 'last24h', hours: 24 },
  { type: 'last7d', hours: 24 * 7 },
  { type: 'last30d', hours: 24 * 30 },
  { type: 'custom' },
]

export const TimeWindowSelector: React.FC<TimeWindowSelectorProps> = ({ value, onChange }) => {
  const { t } = useTranslation()
  const [activePreset, setActivePreset] = useState<PresetType | null>(null)

  const formatDatetimeLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const calculateTimeWindow = (hours: number) => {
    const end = new Date()
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000)
    return {
      start: formatDatetimeLocal(start),
      end: formatDatetimeLocal(end),
    }
  }

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.type)
    if (preset.type === 'custom') {
      return
    }
    if (preset.hours) {
      const window = calculateTimeWindow(preset.hours)
      onChange(window)
    }
  }

  const handleCustomChange = (field: 'start' | 'end', newValue: string) => {
    onChange({
      ...value,
      [field]: newValue,
    })
  }

  const isCustomMode = activePreset === 'custom' || activePreset === null

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-4 block">{t('timeWindow.label')}</Label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {PRESETS.map((preset) => {
            const presetLabel = t(`timeWindow.presets.${preset.type}`)
            return (
              <Button
                key={preset.type}
                type="button"
                variant={activePreset === preset.type ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  'min-h-[44px] w-full',
                  activePreset === preset.type &&
                    'aria-pressed:border-primary aria-pressed:from-primary aria-pressed:to-accent'
                )}
                aria-pressed={activePreset === preset.type}
                aria-label={t('timeWindow.selectAriaLabel', { preset: presetLabel })}
              >
                {presetLabel}
              </Button>
            )
          })}
        </div>
      </div>

      {isCustomMode && (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label={t('timeWindow.from')} required>
            <Input
              id="time_window_start"
              type="datetime-local"
              value={value.start}
              onChange={(e) => handleCustomChange('start', e.target.value)}
              required
              className="min-h-[44px]"
              aria-label={t('timeWindow.startAriaLabel')}
            />
          </FormField>

          <FormField label={t('timeWindow.to')} required>
            <Input
              id="time_window_end"
              type="datetime-local"
              value={value.end}
              onChange={(e) => handleCustomChange('end', e.target.value)}
              required
              className="min-h-[44px]"
              aria-label={t('timeWindow.endAriaLabel')}
            />
          </FormField>
        </div>
      )}
    </div>
  )
}
