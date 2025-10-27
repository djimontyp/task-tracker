import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWizardStore } from '../store/wizardStore'
import { useCreateJob, useCreateRule, useUpdateNotificationPreferences } from '../api/automationService'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Progress } from '@/shared/ui/progress'
import { ScheduleConfigStep } from './ScheduleConfigStep'
import { RulesConfigStep } from './RulesConfigStep'
import { NotificationsConfigStep } from './NotificationsConfigStep'
import { ReviewActivateStep } from './ReviewActivateStep'
import toast from 'react-hot-toast'
import { cn } from '@/shared/lib/utils'

const STEPS = [
  { id: 0, title: 'Schedule', component: ScheduleConfigStep },
  { id: 1, title: 'Rules', component: RulesConfigStep },
  { id: 2, title: 'Notifications', component: NotificationsConfigStep },
  { id: 3, title: 'Review & Activate', component: ReviewActivateStep },
]

export function AutomationOnboardingWizard() {
  const navigate = useNavigate()
  const { currentStep, formData, isValid, nextStep, prevStep, setCurrentStep, resetWizard } =
    useWizardStore()
  const [isActivating, setIsActivating] = useState(false)

  const createJobMutation = useCreateJob()
  const createRuleMutation = useCreateRule()
  const updateNotificationsMutation = useUpdateNotificationPreferences()

  const CurrentStepComponent = STEPS[currentStep].component
  const progress = ((currentStep + 1) / STEPS.length) * 100

  const canProceed = () => {
    if (currentStep === 0) return isValid.schedule
    if (currentStep === 1) return isValid.rules
    if (currentStep === 2) return isValid.notifications
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

      await updateNotificationsMutation.mutateAsync({
        email_enabled: formData.notifications.email_enabled,
        email_address: formData.notifications.email_address,
        telegram_enabled: formData.notifications.telegram_enabled,
        telegram_chat_id: formData.notifications.telegram_chat_id,
        pending_threshold: formData.notifications.pending_threshold,
        daily_digest_enabled: formData.notifications.digest_enabled,
        digest_frequency: formData.notifications.digest_frequency,
      })

      toast.success('Automation activated successfully!', { id: toastId })
      resetWizard()
      navigate('/automation/dashboard')
    } catch (error) {
      console.error('Failed to activate automation:', error)
      toast.error('Failed to activate automation', { id: toastId })
    } finally {
      setIsActivating(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Automation Setup Wizard</h1>
        <p className="text-muted-foreground">
          Configure automated knowledge extraction in 4 simple steps
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
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
              Skip & Configure Later
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrevious} disabled={isActivating}>
              Previous
            </Button>
          )}
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
            </Button>
          ) : (
            <Button
              onClick={handleActivate}
              disabled={isActivating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isActivating ? 'Activating...' : 'Activate Automation'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
