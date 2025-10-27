import { useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Slider } from '@/shared/ui/slider'
import { Switch } from '@/shared/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { RuleConditionInput } from './RuleConditionInput'
import { useCreateRule, useUpdateRule } from '../api/automationService'
import type { AutomationRule, RuleTemplate } from '../types'

const ruleFormSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  conditions: z
    .array(
      z.object({
        field: z.string().min(1),
        operator: z.enum(['gte', 'lte', 'eq', 'ne', 'contains', 'starts_with']),
        value: z.union([z.string(), z.number()]),
      })
    )
    .min(1, 'At least one condition is required'),
  logic_operator: z.enum(['AND', 'OR']),
  action: z.enum(['approve', 'reject', 'escalate', 'notify']),
  priority: z.number().min(0).max(100),
  enabled: z.boolean(),
})

type RuleFormData = z.infer<typeof ruleFormSchema>

interface RuleBuilderFormProps {
  rule?: AutomationRule
  template?: RuleTemplate
  onSuccess?: () => void
  onCancel?: () => void
}

export function RuleBuilderForm({ rule, template, onSuccess, onCancel }: RuleBuilderFormProps) {
  const isEditing = !!rule

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
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
    } catch (error) {
      toast.error(isEditing ? 'Failed to update rule' : 'Failed to create rule')
    }
  }

  const addCondition = () => {
    append({ field: 'confidence', operator: 'gte', value: 90 })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Rule' : 'Create New Rule'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input id="name" {...register('name')} placeholder="High Confidence Auto-Approval" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Priority (0-100)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[priority]}
                onValueChange={(value) => setValue('priority', value[0])}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">{priority}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Conditions</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                + Add Condition
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded">
                No conditions added yet. Click "Add Condition" to start.
              </div>
            ) : (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <Controller
                    key={field.id}
                    control={control}
                    name={`conditions.${index}`}
                    render={({ field: fieldProps }) => (
                      <RuleConditionInput
                        index={index}
                        value={fieldProps.value}
                        onChange={fieldProps.onChange}
                        onRemove={() => remove(index)}
                      />
                    )}
                  />
                ))}
              </div>
            )}

            {errors.conditions && (
              <p className="text-sm text-destructive">{errors.conditions.message}</p>
            )}
          </div>

          {fields.length >= 2 && (
            <div className="space-y-2">
              <Label>Logic Operator</Label>
              <Controller
                control={control}
                name="logic_operator"
                render={({ field }) => (
                  <RadioGroup value={field.value} onValueChange={field.onChange}>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="AND" id="and" />
                        <Label htmlFor="and" className="font-normal cursor-pointer">
                          AND (all conditions must match)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="OR" id="or" />
                        <Label htmlFor="or" className="font-normal cursor-pointer">
                          OR (any condition can match)
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Controller
              control={control}
              name="action"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="action">
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
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enabled</Label>
            <Controller
              control={control}
              name="enabled"
              render={({ field }) => (
                <Switch id="enabled" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isEditing
                  ? 'Update Rule'
                  : 'Create Rule'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
