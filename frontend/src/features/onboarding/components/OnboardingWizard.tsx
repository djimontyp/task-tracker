import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import { Check, Rocket, MessageSquare, Cpu, FileDown } from 'lucide-react'

const STEP_IDS = ['welcome', 'telegram', 'agent', 'import', 'complete'] as const
type StepId = (typeof STEP_IDS)[number]

const STEP_ICONS: Record<StepId, typeof Rocket> = {
  welcome: Rocket,
  telegram: MessageSquare,
  agent: Cpu,
  import: FileDown,
  complete: Check,
}

interface OnboardingWizardProps {
  open?: boolean
  onClose?: () => void
  onComplete?: () => void
}

export function OnboardingWizard({ open: controlledOpen, onClose, onComplete }: OnboardingWizardProps) {
  const { t } = useTranslation('onboarding')
  const [currentStep, setCurrentStep] = useState(0)
  const [isOpen, setIsOpen] = useState(controlledOpen ?? true)

  useEffect(() => {
    if (controlledOpen !== undefined) {
      setIsOpen(controlledOpen)
    }
  }, [controlledOpen])

  const totalSteps = STEP_IDS.length
  const progress = ((currentStep + 1) / totalSteps) * 100
  const stepId = STEP_IDS[currentStep]
  const StepIcon = STEP_ICONS[stepId]

  const handleNext = () => {
    if (currentStep === totalSteps - 1) {
      localStorage.setItem('onboarding_completed', 'true')
      setIsOpen(false)
      onComplete?.()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  const handleSkip = () => {
    localStorage.setItem('onboarding_skipped', 'true')
    setIsOpen(false)
    onClose?.()
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      onClose?.()
    }
  }

  const stepTitle = t(`steps.${stepId}.title`)
  const stepDescription = t(`steps.${stepId}.description`)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle className="sr-only">{t('title')} - {stepTitle}</DialogTitle>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-muted-foreground">
              {t('progress.step', { current: currentStep + 1, total: totalSteps })}
            </p>
            {currentStep < totalSteps - 1 && (
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                {t('progress.skip')}
              </Button>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="py-8 text-center">
          {currentStep === totalSteps - 1 ? (
            <div className="w-16 h-16 rounded-full bg-semantic-success/10 flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-semantic-success" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <StepIcon className="h-8 w-8 text-primary" />
            </div>
          )}

          <h2 className="text-2xl font-semibold mb-4">{stepTitle}</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">{stepDescription}</p>

          <div className="min-h-[200px] flex items-center justify-center">
            {stepId === 'telegram' && (
              <div className="text-left space-y-4 w-full max-w-md mx-auto p-6 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm">{t('steps.telegram.instructions.title')}</p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  {(t('steps.telegram.instructions.steps', { returnObjects: true }) as string[]).map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {stepId === 'agent' && (
              <div className="text-left space-y-4 w-full max-w-md mx-auto p-6 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm">{t('steps.agent.instructions.title')}</p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  {(t('steps.agent.instructions.steps', { returnObjects: true }) as string[]).map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {stepId === 'import' && (
              <div className="text-left space-y-4 w-full max-w-md mx-auto p-6 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm">{t('steps.import.instructions.title')}</p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  {(t('steps.import.instructions.steps', { returnObjects: true }) as string[]).map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {stepId === 'welcome' && (
              <div className="text-center space-y-6">
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {t('steps.welcome.content')}
                </p>
              </div>
            )}

            {stepId === 'complete' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('steps.complete.content')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
            {t('actions.back')}
          </Button>
          <Button onClick={handleNext} size="lg">
            {currentStep === totalSteps - 1 ? t('actions.getStarted') : t('actions.continue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
