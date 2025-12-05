import { Controller, Control, FieldErrors } from 'react-hook-form'
import { Input } from '@/shared/ui/input'
import { Slider } from '@/shared/ui/slider'
import { FormField, FormSection } from '@/shared/patterns'
import type { RuleFormData } from './ruleFormSchema'

interface RuleBasicInfoProps {
  control: Control<RuleFormData>
  errors: FieldErrors<RuleFormData>
  priority: number
  onPriorityChange: (value: number) => void
}

export function RuleBasicInfo({
  control,
  errors,
  priority,
  onPriorityChange,
}: RuleBasicInfoProps) {
  return (
    <FormSection title="Basic Information">
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <FormField label="Rule Name" error={errors.name?.message} required>
            <Input {...field} placeholder="High Confidence Auto-Approval" />
          </FormField>
        )}
      />

      <FormField label="Priority (0-100)">
        <div className="flex items-center gap-4">
          <Slider
            value={[priority]}
            onValueChange={(value) => onPriorityChange(value[0])}
            min={0}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm font-medium w-12 text-right">{priority}</span>
        </div>
      </FormField>
    </FormSection>
  )
}
