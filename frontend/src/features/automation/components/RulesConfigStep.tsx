import { useTranslation } from 'react-i18next'
import { useWizardStore } from '../store/wizardStore'
import { Slider } from '@/shared/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib/utils'
import { FormField, FormSection } from '@/shared/patterns'

export function RulesConfigStep() {
  const { t } = useTranslation('settings')
  const { formData, updateRules } = useWizardStore()

  const ACTION_OPTIONS = [
    {
      value: 'approve',
      label: t('automation.rules.actions.autoApprove'),
      description: t('automation.rules.actions.autoApproveDescription'),
      color: 'bg-semantic-success/10 text-semantic-success',
    },
    {
      value: 'reject',
      label: t('automation.rules.actions.autoReject'),
      description: t('automation.rules.actions.autoRejectDescription'),
      color: 'bg-semantic-error/10 text-semantic-error',
    },
    {
      value: 'manual_review',
      label: t('automation.rules.actions.manualReview'),
      description: t('automation.rules.actions.manualReviewDescription'),
      color: 'bg-semantic-warning/10 text-semantic-warning',
    },
  ] as const

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
      ? t('automation.rules.impact.high')
      : formData.rules.confidence_threshold >= 60 && formData.rules.similarity_threshold >= 60
      ? t('automation.rules.impact.medium')
      : t('automation.rules.impact.low')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('automation.rules.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('automation.rules.description')}
        </p>
      </div>

      <FormSection title={t('automation.rules.thresholds.title')}>
        <FormField
          label={t('automation.rules.thresholds.confidence')}
          description={t('automation.rules.thresholds.confidenceDescription')}
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
          label={t('automation.rules.thresholds.similarity')}
          description={t('automation.rules.thresholds.similarityDescription')}
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

      <FormField label={t('automation.rules.actionLabel')}>
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
        <h4 className="text-sm font-medium mb-2">{t('automation.rules.estimatedImpact')}</h4>
        <p className="text-sm text-muted-foreground">{estimatedImpact}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">{t('automation.rules.thresholds.confidenceLabel')}</span>{' '}
            <span className="font-mono font-medium">{t('automation.rules.thresholds.minValue', { value: formData.rules.confidence_threshold })}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('automation.rules.thresholds.similarityLabel')}</span>{' '}
            <span className="font-mono font-medium">{t('automation.rules.thresholds.minValue', { value: formData.rules.similarity_threshold })}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
