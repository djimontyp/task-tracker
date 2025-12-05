import { Controller, Control, FieldErrors, UseFieldArrayReturn } from 'react-hook-form'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { FormField, FormSection } from '@/shared/patterns'
import { RuleConditionInput } from './RuleConditionInput'
import type { RuleFormData } from './ruleFormSchema'

interface RuleConditionsProps {
  control: Control<RuleFormData>
  errors: FieldErrors<RuleFormData>
  fields: UseFieldArrayReturn<RuleFormData, 'conditions'>['fields']
  onAddCondition: () => void
  onRemoveCondition: (index: number) => void
}

export function RuleConditions({
  control,
  errors,
  fields,
  onAddCondition,
  onRemoveCondition,
}: RuleConditionsProps) {
  return (
    <>
      <FormSection title="Conditions">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Define when this rule should trigger
            </span>
            <Button type="button" variant="outline" size="sm" onClick={onAddCondition}>
              + Add Condition
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded">
              No conditions added yet. Click &quot;Add Condition&quot; to start.
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
                      onRemove={() => onRemoveCondition(index)}
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
      </FormSection>

      {fields.length >= 2 && (
        <FormField label="Logic Operator">
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
        </FormField>
      )}
    </>
  )
}
