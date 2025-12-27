import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import { Check, Rocket, MessageSquare, Cpu, FileDown } from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  content?: React.ReactNode
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Ласкаво просимо до Pulse Radar',
    description: 'Налаштуємо ваш AI-трекер задач за 4 простих кроки',
  },
  {
    id: 'telegram',
    title: 'Підключіть Telegram',
    description: "Зв'яжіть Telegram бота для імпорту повідомлень",
  },
  {
    id: 'agent',
    title: 'Налаштуйте AI агента',
    description: 'Створіть першого AI агента для аналізу задач',
  },
  {
    id: 'import',
    title: 'Імпортуйте повідомлення',
    description: 'Завантажте першу партію повідомлень для аналізу',
  },
  {
    id: 'complete',
    title: 'Все готово!',
    description: 'Можете починати аналіз задач',
  },
]

const STEP_ICONS = {
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
  const [currentStep, setCurrentStep] = useState(0)
  const [isOpen, setIsOpen] = useState(controlledOpen ?? true)

  useEffect(() => {
    if (controlledOpen !== undefined) {
      setIsOpen(controlledOpen)
    }
  }, [controlledOpen])

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100
  const step = ONBOARDING_STEPS[currentStep]
  const StepIcon = STEP_ICONS[step.id as keyof typeof STEP_ICONS]

  const handleNext = () => {
    if (currentStep === ONBOARDING_STEPS.length - 1) {
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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle className="sr-only">Onboarding Wizard - {step.title}</DialogTitle>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-muted-foreground">
              Крок {currentStep + 1} з {ONBOARDING_STEPS.length}
            </p>
            {currentStep < ONBOARDING_STEPS.length - 1 && (
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Пропустити
              </Button>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="py-8 text-center">
          {currentStep === ONBOARDING_STEPS.length - 1 ? (
            <div className="w-16 h-16 rounded-full bg-semantic-success/10 flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-semantic-success" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <StepIcon className="h-8 w-8 text-primary" />
            </div>
          )}

          <h2 className="text-2xl font-semibold mb-4">{step.title}</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">{step.description}</p>

          <div className="min-h-[200px] flex items-center justify-center">
            {step.id === 'telegram' && (
              <div className="text-left space-y-4 w-full max-w-md mx-auto p-6 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm">Для підключення Telegram:</p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Перейдіть до Settings → Sources</li>
                  <li>Натисніть &quot;Connect Telegram&quot;</li>
                  <li>Введіть API credentials</li>
                </ol>
              </div>
            )}

            {step.id === 'agent' && (
              <div className="text-left space-y-4 w-full max-w-md mx-auto p-6 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm">Створення AI агента:</p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Перейдіть до Agents</li>
                  <li>Натисніть &quot;Create Agent&quot;</li>
                  <li>Налаштуйте параметри аналізу</li>
                </ol>
              </div>
            )}

            {step.id === 'import' && (
              <div className="text-left space-y-4 w-full max-w-md mx-auto p-6 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm">Імпорт повідомлень:</p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Перейдіть до Messages</li>
                  <li>Натисніть &quot;Ingest Messages&quot;</li>
                  <li>Виберіть джерело та період</li>
                </ol>
              </div>
            )}

            {step.id === 'welcome' && (
              <div className="text-center space-y-6">
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Pulse Radar - це AI-система для класифікації та аналізу задач з ваших повідомлень.
                  Налаштуємо все за кілька хвилин.
                </p>
              </div>
            )}

            {step.id === 'complete' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Система готова до роботи! Починайте імпортувати повідомлення та аналізувати задачі.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
            Назад
          </Button>
          <Button onClick={handleNext} size="lg">
            {currentStep === ONBOARDING_STEPS.length - 1 ? 'Почати роботу' : 'Продовжити'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
