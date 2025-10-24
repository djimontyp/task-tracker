import React, { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { cn } from '@/shared/lib'

interface TimeWindowSelectorProps {
  value: {
    start: string
    end: string
  }
  onChange: (value: { start: string; end: string }) => void
}

type PresetType = 'last24h' | 'last7d' | 'last30d' | 'custom'

const PRESETS: { type: PresetType; label: string; hours?: number }[] = [
  { type: 'last24h', label: 'Last 24h', hours: 24 },
  { type: 'last7d', label: 'Last 7 days', hours: 24 * 7 },
  { type: 'last30d', label: 'Last 30 days', hours: 24 * 30 },
  { type: 'custom', label: 'Custom' },
]

export const TimeWindowSelector: React.FC<TimeWindowSelectorProps> = ({ value, onChange }) => {
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
        <Label className="mb-3 block">Time Window</Label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {PRESETS.map((preset) => (
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
              aria-label={`Select ${preset.label} time window`}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {isCustomMode && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="time_window_start">From *</Label>
            <Input
              id="time_window_start"
              type="datetime-local"
              value={value.start}
              onChange={(e) => handleCustomChange('start', e.target.value)}
              required
              className="min-h-[44px]"
              aria-label="Time window start"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time_window_end">To *</Label>
            <Input
              id="time_window_end"
              type="datetime-local"
              value={value.end}
              onChange={(e) => handleCustomChange('end', e.target.value)}
              required
              className="min-h-[44px]"
              aria-label="Time window end"
            />
          </div>
        </div>
      )}
    </div>
  )
}
