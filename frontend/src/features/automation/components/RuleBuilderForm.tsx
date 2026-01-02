import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { RuleBasicInfo } from './RuleBasicInfo'
import { RuleConditions } from './RuleConditions'
import { RuleActions } from './RuleActions'
import { useCreateRule, useUpdateRule } from '../api/automationService'
import type { AutomationRule, RuleTemplate } from '../types'
import { ruleFormSchema, type RuleFormData } from './ruleFormSchema'

interface RuleBuilderFormProps {
  rule?: AutomationRule
  template?: RuleTemplate
  onSuccess?: () => void
  onCancel?: () => void
}

export function RuleBuilderForm({ rule, template, onSuccess, onCancel }: RuleBuilderFormProps) {
  const { t } = useTranslation('settings')
  const isEditing = !!rule

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState,
  } = useForm<RuleFormData>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: rule?.name || template?.name || '',
      conditions: rule?.conditions || template?.conditions || [],
      logic_operator: 'AND',
      action: rule?.action || template?.action || 'approve',
      priority: rule?.priority || template?.priority || 50,
      enabled: rule?.enabled ?? true,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'conditions',
  })

  const createMutation = useCreateRule()
  const updateMutation = useUpdateRule()

  const priority = watch('priority')

  useEffect(() => {
    if (template) {
      setValue('name', template.name)
      setValue('conditions', template.conditions)
      setValue('action', template.action)
      setValue('priority', template.priority)
    }
  }, [template, setValue])

  const onSubmit = async (data: RuleFormData) => {
    try {
      if (isEditing && rule) {
        await updateMutation.mutateAsync({
          ruleId: rule.id,
          data: {
            name: data.name,
            conditions: data.conditions,
            action: data.action,
            priority: data.priority,
            enabled: data.enabled,
          },
        })
        toast.success('Rule updated successfully')
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          conditions: data.conditions,
          action: data.action,
          priority: data.priority,
          enabled: data.enabled,
        })
        toast.success('Rule created successfully')
      }
      onSuccess?.()
    } catch {
      toast.error(isEditing ? 'Failed to update rule' : 'Failed to create rule')
    }
  }

  const addCondition = () => {
    append({ field: 'confidence', operator: 'gte', value: 90 })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? t('automation.common.editRule') : t('automation.common.createNewRule')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <RuleBasicInfo
            control={control}
            errors={formState.errors}
            priority={priority}
            onPriorityChange={(value) => setValue('priority', value)}
          />

          <RuleConditions
            control={control}
            errors={formState.errors}
            fields={fields}
            onAddCondition={addCondition}
            onRemoveCondition={remove}
          />

          <RuleActions control={control} />

          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('automation.common.cancel')}
              </Button>
            )}
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending || updateMutation.isPending
                ? t('automation.common.saving')
                : isEditing
                  ? t('automation.common.updateRule')
                  : t('automation.common.createRule')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
