import { Controller, Control } from 'react-hook-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { Label } from '@/shared/ui/label'
import { FormField, FormSection } from '@/shared/patterns'
import type { RuleFormData } from './ruleFormSchema'

interface RuleActionsProps {
  control: Control<RuleFormData>
}

export function RuleActions({ control }: RuleActionsProps) {
  return (
    <FormSection title="Action & Status">
      <FormField label="Action">
        <Controller
          control={control}
          name="action"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
                <SelectItem value="escalate">Escalate</SelectItem>
                <SelectItem value="notify">Notify</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <div className="flex items-center justify-between pt-2">
        <Label htmlFor="enabled">Enabled</Label>
        <Controller
          control={control}
          name="enabled"
          render={({ field }) => (
            <Switch id="enabled" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>
    </FormSection>
  )
}
