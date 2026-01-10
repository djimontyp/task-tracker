import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWizardStore } from '../store/wizardStore'
import { useCreateJob, useCreateRule } from '../api/automationService'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Progress } from '@/shared/ui/progress'
import { ScheduleConfigStep } from './ScheduleConfigStep'
import { RulesConfigStep } from './RulesConfigStep'
import { ReviewActivateStep } from './ReviewActivateStep'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'

const STEPS = [
  { id: 0, title: 'Schedule', component: ScheduleConfigStep },
  { id: 1, title: 'Rules', component: RulesConfigStep },
  { id: 2, title: 'Review & Activate', component: ReviewActivateStep },
]

export function AutomationOnboardingWizard() {
  const { t } = useTranslation('settings')
  const navigate = useNavigate()
  const { currentStep, formData, isValid, nextStep, prevStep, setCurrentStep, resetWizard } =
    useWizardStore()
  const [isActivating, setIsActivating] = useState(false)

  const createJobMutation = useCreateJob()
  const createRuleMutation = useCreateRule()

  const CurrentStepComponent = STEPS[currentStep].component
  const progress = ((currentStep + 1) / STEPS.length) * 100

  const canProceed = () => {
    if (currentStep === 0) return isValid.schedule
    if (currentStep === 1) return isValid.rules
    return true
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      nextStep()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      prevStep()
    }
  }

  const handleSkip = () => {
    navigate('/automation/dashboard')
  }

  const handleActivate = async () => {
    setIsActivating(true)
    const toastId = toast.loading('Activating automation...')

    try {
      await createJobMutation.mutateAsync({
        name: 'Knowledge Extraction Automation',
        schedule_cron: formData.schedule.cron_expression,
        enabled: true,
      })

      await createRuleMutation.mutateAsync({
        name: 'Default Auto-Approval Rule',
        conditions: [
          {
            field: 'confidence',
            operator: 'gte',
            value: formData.rules.confidence_threshold,
          },
          {
            field: 'similarity',
            operator: 'gte',
            value: formData.rules.similarity_threshold,
          },
        ],
        action: formData.rules.action === 'manual_review' ? 'approve' : formData.rules.action,
        priority: 50,
        enabled: true,
      })

      toast.success('Automation activated successfully!', { id: toastId })
      resetWizard()
      navigate('/automation/dashboard')
    } catch {
      toast.error('Failed to activate automation', { id: toastId })
    } finally {
      setIsActivating(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('automation.wizard.title')}</h1>
        <p className="text-muted-foreground">
          {t('automation.wizard.description')}
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  'flex items-center gap-2 text-sm transition-colors',
                  index === currentStep
                    ? 'text-primary font-medium'
                    : index < currentStep
                    ? 'text-foreground hover:text-primary cursor-pointer'
                    : 'text-muted-foreground cursor-default'
                )}
                disabled={index > currentStep}
              >
                <div
                  className={cn(
                    'size-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                    index === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : index < currentStep
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {index + 1}
                </div>
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            ))}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="p-6 mb-6">
        <CurrentStepComponent />
      </Card>

      <div className="flex items-center justify-between">
        <div>
          {currentStep === STEPS.length - 1 && (
            <Button variant="ghost" onClick={handleSkip}>
              {t('automation.wizard.skipConfigureLater')}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrevious} disabled={isActivating}>
              {t('automation.wizard.previous')}
            </Button>
          )}
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              {t('automation.wizard.next')}
            </Button>
          ) : (
            <Button
              onClick={handleActivate}
              disabled={isActivating}
              className="bg-semantic-success hover:bg-semantic-success/90 text-white"
            >
              {isActivating ? t('automation.wizard.activating') : t('automation.wizard.activateAutomation')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
