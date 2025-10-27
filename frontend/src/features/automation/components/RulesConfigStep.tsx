import { useWizardStore } from '../store/wizardStore'
import { Label } from '@/shared/ui/label'
import { Slider } from '@/shared/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib/utils'

const ACTION_OPTIONS = [
  {
    value: 'approve',
    label: 'Auto-Approve',
    description: 'Automatically approve versions meeting thresholds',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  },
  {
    value: 'reject',
    label: 'Auto-Reject',
    description: 'Automatically reject versions below thresholds',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
  },
  {
    value: 'manual_review',
    label: 'Manual Review',
    description: 'Flag for manual review without auto-action',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
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

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Confidence Threshold</Label>
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
          <p className="text-xs text-muted-foreground mt-2">
            Minimum AI confidence score required for auto-action
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Similarity Threshold</Label>
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
          <p className="text-xs text-muted-foreground mt-2">
            Minimum similarity score to existing knowledge base
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">Action</Label>
          <RadioGroup value={formData.rules.action} onValueChange={handleActionChange}>
            <div className="grid gap-3">
              {ACTION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  htmlFor={option.value}
                  className={cn(
                    'flex items-start space-x-3 rounded-lg border p-3 transition-colors cursor-pointer',
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
                    <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 border border-border p-4">
        <h4 className="text-sm font-medium mb-2">Estimated Impact</h4>
        <p className="text-sm text-muted-foreground">{estimatedImpact}</p>
        <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
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
