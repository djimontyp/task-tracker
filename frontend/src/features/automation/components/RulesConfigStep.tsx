import { useWizardStore } from '../store/wizardStore'
import { Slider } from '@/shared/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib/utils'
import { FormField, FormSection } from '@/shared/patterns'

const ACTION_OPTIONS = [
  {
    value: 'approve',
    label: 'Auto-Approve',
    description: 'Automatically approve versions meeting thresholds',
    color: 'bg-semantic-success/10 text-semantic-success',
  },
  {
    value: 'reject',
    label: 'Auto-Reject',
    description: 'Automatically reject versions below thresholds',
    color: 'bg-semantic-error/10 text-semantic-error',
  },
  {
    value: 'manual_review',
    label: 'Manual Review',
    description: 'Flag for manual review without auto-action',
    color: 'bg-semantic-warning/10 text-semantic-warning',
  },
] as const

export function RulesConfigStep() {
  const { formData, updateRules } = useWizardStore()

  const handleConfidenceChange = (values: number[]) => {
    updateRules({ confidence_threshold: values[0] })
  }

  const handleSimilarityChange = (values: number[]) => {
    updateRules({ similarity_threshold: values[0] })
  }

  const handleActionChange = (action: string) => {
    updateRules({ action: action as 'approve' | 'reject' | 'manual_review' })
  }

  const estimatedImpact =
    formData.rules.confidence_threshold >= 80 && formData.rules.similarity_threshold >= 80
      ? 'High automation rate (~85% of versions)'
      : formData.rules.confidence_threshold >= 60 && formData.rules.similarity_threshold >= 60
      ? 'Medium automation rate (~60% of versions)'
      : 'Low automation rate (~30% of versions)'

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Auto-Approval Rules</h3>
        <p className="text-sm text-muted-foreground">
          Configure thresholds and actions for automated decision-making
        </p>
      </div>

      <FormSection title="Thresholds">
        <FormField
          label="Confidence Threshold"
          description="Minimum AI confidence score required for auto-action"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="font-mono">
                {formData.rules.confidence_threshold}%
              </Badge>
            </div>
            <Slider
              value={[formData.rules.confidence_threshold]}
              onValueChange={handleConfidenceChange}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </FormField>

        <FormField
          label="Similarity Threshold"
          description="Minimum similarity score to existing knowledge base"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="font-mono">
                {formData.rules.similarity_threshold}%
              </Badge>
            </div>
            <Slider
              value={[formData.rules.similarity_threshold]}
              onValueChange={handleSimilarityChange}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </FormField>
      </FormSection>

      <FormField label="Action">
        <RadioGroup value={formData.rules.action} onValueChange={handleActionChange}>
          <div className="grid gap-4">
            {ACTION_OPTIONS.map((option) => (
              <label
                key={option.value}
                htmlFor={option.value}
                className={cn(
                  'flex items-start space-x-4 rounded-lg border p-4 transition-colors cursor-pointer',
                  formData.rules.action === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                    {option.label}
                    <Badge className={cn('text-xs', option.color)}>{option.value}</Badge>
                  </span>
                  <p className="text-xs text-muted-foreground mt-2">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </RadioGroup>
      </FormField>

      <div className="rounded-lg bg-muted/50 border border-border p-4">
        <h4 className="text-sm font-medium mb-2">Estimated Impact</h4>
        <p className="text-sm text-muted-foreground">{estimatedImpact}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Confidence:</span>{' '}
            <span className="font-mono font-medium">≥{formData.rules.confidence_threshold}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Similarity:</span>{' '}
            <span className="font-mono font-medium">≥{formData.rules.similarity_threshold}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
