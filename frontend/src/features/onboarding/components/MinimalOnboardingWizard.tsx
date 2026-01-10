/**
 * Minimal Onboarding Wizard - Editorial Minimalism Aesthetic
 *
 * Design Philosophy:
 * - Shows only what's needed, when it's needed
 * - Collapses completed steps for breathing room
 * - Integrates seamlessly with hero section
 * - Direct CTAs, no verbose instructions
 */

import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  MessageSquare,
  FolderOpen,
  Cpu,
  Download,
  Check,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import { cn } from '@/shared/lib'

// Step status types
type StepStatus = 'locked' | 'active' | 'completed' | 'pending'

interface Step {
  id: string
  icon: typeof MessageSquare
  title: string
  action: string
  actionRoute?: string
  status: StepStatus
}

interface MinimalOnboardingWizardProps {
  // Step statuses from parent (DashboardPage)
  step1Complete: boolean
  step2Complete: boolean
  step3Complete: boolean
  step4Complete: boolean

  // Callbacks
  onNavigate?: (route: string) => void
  onDismiss?: () => void
}

export function MinimalOnboardingWizard({
  step1Complete,
  step2Complete,
  step3Complete,
  step4Complete,
  onNavigate,
  onDismiss,
}: MinimalOnboardingWizardProps) {
  const { t } = useTranslation('onboarding')
  const navigate = useNavigate()
  const [isDismissed, setIsDismissed] = useState(false)

  // Compute step statuses
  const steps: Step[] = useMemo(() => [
    {
      id: 'sources',
      icon: MessageSquare,
      title: t('wizard.minimal.steps.sources.title'),
      action: t('wizard.minimal.steps.sources.action'),
      actionRoute: '/settings?tab=sources',
      status: step1Complete ? 'completed' : 'active',
    },
    {
      id: 'project',
      icon: FolderOpen,
      title: t('wizard.minimal.steps.project.title'),
      action: t('wizard.minimal.steps.project.action'),
      actionRoute: '/projects',
      status: !step1Complete ? 'locked' : step2Complete ? 'completed' : 'active',
    },
    {
      id: 'agent',
      icon: Cpu,
      title: t('wizard.minimal.steps.agent.title'),
      action: t('wizard.minimal.steps.agent.action'),
      actionRoute: '/agents',
      status: !step2Complete ? 'locked' : step3Complete ? 'completed' : 'active',
    },
    {
      id: 'import',
      icon: Download,
      title: t('wizard.minimal.steps.import.title'),
      action: t('wizard.minimal.steps.import.action'),
      status: !step3Complete ? 'locked' : step4Complete ? 'completed' : 'pending',
    },
  ], [step1Complete, step2Complete, step3Complete, step4Complete, t])

  // Reserved for future use (e.g., step navigation)
  const _currentStepIndex = useMemo(() =>
    steps.findIndex(s => s.status === 'active' || s.status === 'pending'),
    [steps]
  )
  void _currentStepIndex

  const progress = useMemo(() =>
    ((steps.filter(s => s.status === 'completed').length) / steps.length) * 100,
    [steps]
  )

  const isSetupComplete = useMemo(() =>
    step3Complete && !step4Complete,
    [step3Complete, step4Complete]
  )

  const isFullyComplete = useMemo(() =>
    step4Complete,
    [step4Complete]
  )

  const handleStepAction = useCallback((step: Step) => {
    if (step.actionRoute) {
      if (onNavigate) {
        onNavigate(step.actionRoute)
      } else {
        navigate(step.actionRoute)
      }
    }
  }, [navigate, onNavigate])

  const handleDismiss = useCallback(() => {
    setIsDismissed(true)
    onDismiss?.()
  }, [onDismiss])

  // Don't render if dismissed or fully complete
  if (isDismissed || isFullyComplete) return null

  // Collapsed state: Setup complete, waiting for data
  if (isSetupComplete) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-semantic-success/10">
              <Sparkles className="h-5 w-5 text-semantic-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t('wizard.minimal.collapsed.title')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('wizard.minimal.collapsed.description')}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleDismiss}
            aria-label={t('wizard.minimal.dismissAriaLabel')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Subtle animated progress bar */}
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-semantic-success/60 animate-pulse"
            style={{ width: '75%' }}
          />
        </div>
      </div>
    )
  }

  // Active state: Show current step with minimal UI
  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('wizard.minimal.progress.label')}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      {/* Steps list - refined vertical layout */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = step.status === 'active' || step.status === 'pending'
          const isCompleted = step.status === 'completed'
          const isLocked = step.status === 'locked'

          return (
            <div
              key={step.id}
              className={cn(
                "group relative transition-all duration-300",
                isActive && "animate-in fade-in slide-in-from-left-4"
              )}
            >
              {/* Active step - expanded */}
              {isActive && (
                <div className="rounded-lg border border-border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <h4 className="text-sm font-medium">{step.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('wizard.minimal.progress.step', { current: index + 1, total: steps.length })}
                        </p>
                      </div>

                      {/* CTA */}
                      {step.actionRoute && (
                        <Button
                          size="sm"
                          onClick={() => handleStepAction(step)}
                          className="w-full sm:w-auto"
                        >
                          {step.action}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}

                      {/* Pending state (Step 4) */}
                      {step.status === 'pending' && (
                        <p className="text-xs text-muted-foreground italic">
                          {t('wizard.minimal.pending')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Completed step - collapsed */}
              {isCompleted && (
                <div className="flex items-center gap-3 px-4 py-2 opacity-60 transition-opacity hover:opacity-80">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-semantic-success/20">
                    <Check className="h-3.5 w-3.5 text-semantic-success" />
                  </div>
                  <span className="text-xs text-muted-foreground line-through">
                    {step.title}
                  </span>
                </div>
              )}

              {/* Locked step - minimal single line */}
              {isLocked && (
                <div className="flex items-center gap-3 px-4 py-2 opacity-30">
                  <div className="h-6 w-6 shrink-0 rounded-full border border-dashed border-muted-foreground/30" />
                  <span className="text-xs text-muted-foreground">
                    {step.title}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Dismiss option */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-xs text-muted-foreground"
        >
          {t('wizard.minimal.dismiss')}
        </Button>
      </div>
    </div>
  )
}
