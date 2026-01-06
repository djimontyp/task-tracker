/**
 * SetupBanner - Compact setup progress banner integrated with CommandCenter
 * 
 * Design Philosophy:
 * - Minimal footprint (~80-100px height)
 * - Integrates with CommandCenter's "mission control" aesthetic
 * - Progressive disclosure: show only current step
 * - Collapsible for non-intrusive UX
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, MessageSquare, FolderPlus, Cpu, Download, ChevronDown, ChevronUp, HelpCircle, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import { useTelegramStore } from '@/shared/store/useTelegramStore'
import type { SetupWizardProps, StepStatus } from '../types/wizard'

type BannerState = 'expanded' | 'collapsed' | 'completed'

interface SetupBannerProps extends SetupWizardProps {
    onShowHelp?: () => void
    onDismiss?: () => void
}

const STEP_ICONS = {
    1: MessageSquare,
    2: FolderPlus,
    3: Cpu,
    4: Download,
} as const

export function SetupBanner({
    step2Status,
    step3Status,
    step4Status,
    onConnectSource,
    onCreateProject,
    onActivateAgent,
    onShowHelp,
    onDismiss,
}: SetupBannerProps) {
    const { t } = useTranslation('onboarding')
    const [bannerState, setBannerState] = useState<BannerState>('expanded')
    const { connectionStatus } = useTelegramStore()

    // Derive step1 status from real Telegram connection state
    const telegramConnected = connectionStatus === 'connected' || connectionStatus === 'warning'
    const step1Status: StepStatus = telegramConnected ? 'completed' : 'active'

    // Calculate current step and progress
    const completedSteps = [
        step1Status === 'completed',
        step2Status === 'completed',
        step3Status === 'completed',
        step4Status === 'completed',
    ].filter(Boolean).length

    const totalSteps = 4
    const progress = (completedSteps / totalSteps) * 100

    // Determine current active step
    const currentStep =
        step1Status !== 'completed' ? 1 :
            step2Status !== 'completed' ? 2 :
                step3Status !== 'completed' ? 3 :
                    step4Status !== 'completed' ? 4 : 0

    const isSetupComplete = completedSteps >= 3 // Steps 1-3 are required, 4 is optional
    const Icon = currentStep > 0 ? STEP_ICONS[currentStep as keyof typeof STEP_ICONS] : Check

    // Get current step info
    const getCurrentStepInfo = () => {
        switch (currentStep) {
            case 1:
                return {
                    title: t('wizard.setupStep.1.title'),
                    action: t('wizard.actions.telegram'),
                    onAction: onConnectSource,
                }
            case 2:
                return {
                    title: t('wizard.setupStep.2.title'),
                    action: t('wizard.actions.createProject'),
                    onAction: onCreateProject,
                }
            case 3:
                return {
                    title: t('wizard.setupStep.3.title'),
                    action: t('wizard.actions.activateAgent'),
                    onAction: onActivateAgent,
                }
            case 4:
                return {
                    title: t('wizard.setupStep.4.title'),
                    action: t('wizard.actions.importHistory', 'Import History'),
                    onAction: undefined, // Auto-triggered
                }
            default:
                return {
                    title: t('steps.complete.title', 'All set!'),
                    action: '',
                    onAction: undefined,
                }
        }
    }

    const stepInfo = getCurrentStepInfo()

    if (bannerState === 'collapsed') {
        return (
            <div
                className="inline-flex items-center gap-3 px-4 py-3 bg-card/50 border border-border/40 rounded-lg cursor-pointer hover:bg-card/70 transition-all group shadow-sm hover:shadow-md"
                onClick={() => setBannerState('expanded')}
            >
                {/* Circular progress indicator */}
                <div className="relative h-12 w-12 shrink-0">
                    {/* Background circle */}
                    <svg className="absolute inset-0 -rotate-90 h-12 w-12">
                        <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            className="text-muted/20"
                        />
                        {/* Progress arc */}
                        <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={`${progress * 1.256} ${125.6 - progress * 1.256}`}
                            className="text-primary transition-all duration-500"
                            strokeLinecap="round"
                        />
                    </svg>
                    {/* Progress text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-foreground">
                            {completedSteps}/{totalSteps}
                        </span>
                    </div>
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {t('wizard.setupProgress', 'Setup Progress')}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {completedSteps === 0
                            ? t('wizard.getStarted', 'Get started with Pulse Radar')
                            : t('wizard.stepsRemaining', '{{count}} steps remaining', {
                                count: totalSteps - completedSteps
                            })
                        }
                    </p>
                </div>

                {/* Expand icon */}
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </div>
        )
    }

    if (isSetupComplete && currentStep === 0) {
        return (
            <div className="relative overflow-hidden rounded-lg border border-semantic-success/20 bg-gradient-to-r from-semantic-success/10 to-transparent mb-6 animate-fade-in">
                <div className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-full bg-semantic-success/20 flex items-center justify-center shrink-0">
                        <Check className="h-5 w-5 text-semantic-success" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-foreground">
                            {t('steps.complete.title', 'All set!')}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {t('steps.complete.content', 'System is analyzing data...')}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={onDismiss}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-card/30 backdrop-blur-sm mb-6 animate-fade-in shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />

            {/* Content */}
            <div className="relative p-4">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-semibold text-foreground">
                                    {t('wizard.title', 'Getting Started')}
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                    {completedSteps}/{totalSteps}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {onShowHelp && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onShowHelp}
                                        className="h-7 text-xs"
                                    >
                                        <HelpCircle className="h-3 w-3 mr-1" />
                                        {t('wizard.actions.needHelp', 'Need Help?')}
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setBannerState('collapsed')}
                                >
                                    <ChevronUp className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <Progress value={progress} className="h-1 mb-3" />

                        {/* Current step */}
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                    {t('wizard.currentStep', 'Step {{current}} of {{total}}', {
                                        current: currentStep,
                                        total: totalSteps,
                                    })}
                                </p>
                                <p className="text-sm font-medium text-foreground">
                                    {stepInfo.title}
                                </p>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                                {stepInfo.onAction && (
                                    <Button
                                        onClick={stepInfo.onAction}
                                        size="sm"
                                        className="h-9"
                                    >
                                        {stepInfo.action}
                                    </Button>
                                )}
                                {currentStep > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setBannerState('collapsed')}
                                        className="h-9 text-xs"
                                    >
                                        {t('wizard.actions.skip', 'Skip')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
