import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('settings')

  return (
    <FormSection title={t('automation.rules.sectionTitle')}>
      <FormField label={t('automation.rules.actionLabel')}>
        <Controller
          control={control}
          name="action"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">{t('automation.rules.actions.approve')}</SelectItem>
                <SelectItem value="reject">{t('automation.rules.actions.reject')}</SelectItem>
                <SelectItem value="escalate">{t('automation.rules.actions.escalate')}</SelectItem>
                <SelectItem value="notify">{t('automation.rules.actions.notify')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <div className="flex items-center justify-between pt-2">
        <Label htmlFor="enabled">{t('automation.rules.enabled')}</Label>
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
