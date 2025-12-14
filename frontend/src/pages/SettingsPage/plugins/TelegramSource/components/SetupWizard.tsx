import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { type SetupStepId, SETUP_STEPS } from '../types'
import { BotInfoStep } from './BotInfoStep'
import { WebhookConfigStep } from './WebhookConfigStep'
import { VerifyConnectionStep } from './VerifyConnectionStep'
import type { TestResult } from './TestConnectionButton'

interface SetupWizardProps {
  webhookBaseUrl: string
  onWebhookBaseUrlChange: (value: string) => void
  defaultBaseUrl: string
  computedWebhookUrl: string
  isValidBaseUrl: boolean
  isSettingWebhook: boolean
  isSaving: boolean
  onUpdateWebhook: () => Promise<void>
  onTestConnection: () => Promise<TestResult | null>
  onComplete: () => void
}

export function SetupWizard({
  webhookBaseUrl,
  onWebhookBaseUrlChange,
  defaultBaseUrl,
  computedWebhookUrl,
  isValidBaseUrl,
  isSettingWebhook,
  isSaving,
  onUpdateWebhook,
  onTestConnection,
  onComplete,
}: SetupWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<SetupStepId>>(new Set())
  const [webhookActivated, setWebhookActivated] = useState(false)

  const currentStep = SETUP_STEPS[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === SETUP_STEPS.length - 1
  const progress = ((currentStepIndex + 1) / SETUP_STEPS.length) * 100

  const handleNext = () => {
    if (!isLastStep) {
      setCompletedSteps(prev => new Set([...prev, currentStep.id]))
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleWebhookActivated = async () => {
    await onUpdateWebhook()
    setWebhookActivated(true)
    setCompletedSteps(prev => new Set([...prev, 'webhook']))
    handleNext()
  }

  const handleFinish = () => {
    setCompletedSteps(prev => new Set([...prev, 'verify']))
    onComplete()
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{currentStep.title}</span>
          <span className="text-muted-foreground">
            Step {currentStepIndex + 1} of {SETUP_STEPS.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />

        {/* Step indicators */}
        <div className="flex justify-between">
          {SETUP_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-2',
                index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2',
                  completedSteps.has(step.id)
                    ? 'bg-primary border-primary text-primary-foreground'
                    : index === currentStepIndex
                    ? 'border-primary text-primary'
                    : 'border-muted text-muted-foreground'
                )}
              >
                {completedSteps.has(step.id) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="hidden sm:inline text-xs">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {currentStep.id === 'bot-info' && (
          <BotInfoStep />
        )}
        {currentStep.id === 'webhook' && (
          <WebhookConfigStep
            webhookBaseUrl={webhookBaseUrl}
            onWebhookBaseUrlChange={onWebhookBaseUrlChange}
            defaultBaseUrl={defaultBaseUrl}
            computedWebhookUrl={computedWebhookUrl}
            isValidBaseUrl={isValidBaseUrl}
            isSettingWebhook={isSettingWebhook}
            isSaving={isSaving}
            onActivate={handleWebhookActivated}
          />
        )}
        {currentStep.id === 'verify' && (
          <VerifyConnectionStep
            onTestConnection={onTestConnection}
            webhookActivated={webhookActivated}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {currentStep.id === 'bot-info' && (
          <Button type="button" onClick={handleNext}>
            Continue
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {currentStep.id === 'verify' && (
          <Button type="button" onClick={handleFinish}>
            Finish Setup
            <Check className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default SetupWizard
