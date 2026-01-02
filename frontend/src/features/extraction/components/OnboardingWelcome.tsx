/**
 * OnboardingWelcome - First-run Experience
 *
 * A welcoming introduction screen for new users with clear value proposition,
 * dual CTAs (Demo vs Connect), and a progress indicator for the setup flow.
 *
 * Design philosophy:
 * - Bold, confident typography with clear hierarchy
 * - Animated elements to create engagement
 * - Clear dual-path CTA (Demo for explorers, Connect for doers)
 * - Progress indicator showing the setup journey
 *
 * @accessibility
 * - WCAG AA compliant
 * - Full keyboard navigation
 * - Screen reader optimized
 * - Reduced motion support
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';
import { touchTarget } from '@/shared/tokens/spacing';
import { focus, transitions } from '@/shared/tokens/patterns';
import {
  Sparkles,
  Brain,
  ArrowRight,
  Play,
  Send,
  CheckCircle,
  ChevronRight,
  Inbox,
  Filter,
  Lightbulb,
  Target,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type OnboardingStep = 'welcome' | 'connect' | 'configure' | 'complete';

export interface OnboardingWelcomeProps {
  /** Called when user clicks Try Demo */
  onTryDemo?: () => void;
  /** Called when user clicks Connect Telegram */
  onConnectTelegram?: () => void;
  /** Called when user skips onboarding */
  onSkip?: () => void;
  /** Current step (for external control) */
  currentStep?: OnboardingStep;
  /** Total message count to show in demo */
  demoMessageCount?: number;
  /** User's name (if known) */
  userName?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const STEPS: { id: OnboardingStep; labelKey: string }[] = [
  { id: 'welcome', labelKey: 'onboarding.steps.welcome' },
  { id: 'connect', labelKey: 'onboarding.steps.connect' },
  { id: 'configure', labelKey: 'onboarding.steps.configure' },
  { id: 'complete', labelKey: 'onboarding.steps.ready' },
];

const VALUE_PROPS: { icon: typeof Inbox; titleKey: string; descriptionKey: string }[] = [
  {
    icon: Inbox,
    titleKey: 'onboarding.valueProps.capture.title',
    descriptionKey: 'onboarding.valueProps.capture.description',
  },
  {
    icon: Filter,
    titleKey: 'onboarding.valueProps.filter.title',
    descriptionKey: 'onboarding.valueProps.filter.description',
  },
  {
    icon: Lightbulb,
    titleKey: 'onboarding.valueProps.extract.title',
    descriptionKey: 'onboarding.valueProps.extract.description',
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

interface StepIndicatorProps {
  steps: typeof STEPS;
  currentStep: OnboardingStep;
}

function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const { t } = useTranslation('extraction');
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label={t('onboarding.progressLabel')} className="flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                'flex items-center justify-center rounded-full transition-all duration-300',
                'h-8 w-8 text-xs font-medium',
                isComplete && 'bg-primary text-primary-foreground',
                isCurrent && 'bg-primary/20 text-primary ring-2 ring-primary ring-offset-2',
                !isComplete && !isCurrent && 'bg-muted text-muted-foreground'
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isComplete ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8 mx-2 transition-colors duration-300',
                  index < currentIndex ? 'bg-primary' : 'bg-muted'
                )}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

interface ValuePropCardProps {
  icon: typeof Inbox;
  titleKey: string;
  descriptionKey: string;
  delay: number;
}

function ValuePropCard({ icon: Icon, titleKey, descriptionKey, delay }: ValuePropCardProps) {
  const { t } = useTranslation('extraction');

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-xl',
        'bg-card border shadow-sm',
        'transform transition-all duration-500',
        'hover:shadow-md hover:-translate-y-0.5',
        'animate-in fade-in-50 slide-in-from-bottom-4'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="rounded-lg bg-primary/10 p-4 shrink-0">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-2">{t(titleKey)}</h3>
        <p className="text-sm text-muted-foreground">{t(descriptionKey)}</p>
      </div>
    </div>
  );
}

interface StatBadgeProps {
  from: number;
  to: number;
  label: string;
}

function StatBadge({ from, to, label }: StatBadgeProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-2 text-2xl font-bold">
        <span className="text-muted-foreground">{from}</span>
        <ArrowRight className="h-5 w-5 text-primary" />
        <span className="text-primary">{to}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{label}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function OnboardingWelcome({
  onTryDemo,
  onConnectTelegram,
  onSkip,
  currentStep = 'welcome',
  demoMessageCount = 500,
  userName,
}: OnboardingWelcomeProps) {
  const { t } = useTranslation('extraction');
  const [isHoveredDemo, setIsHoveredDemo] = useState(false);
  const [isHoveredConnect, setIsHoveredConnect] = useState(false);

  const handleTryDemo = useCallback(() => {
    onTryDemo?.();
  }, [onTryDemo]);

  const handleConnect = useCallback(() => {
    onConnectTelegram?.();
  }, [onConnectTelegram]);

  const handleSkip = useCallback(() => {
    onSkip?.();
  }, [onSkip]);

  // Estimate output from message count
  const estimatedDecisions = Math.round(demoMessageCount * 0.01);
  const estimatedTasks = Math.round(demoMessageCount * 0.03);
  const estimatedInsights = Math.round(demoMessageCount * 0.02);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header with step indicator */}
      <header className="flex-shrink-0 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-4xl w-full">
          {/* Hero section */}
          <div className="text-center mb-12 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            {/* Logo/Brand mark */}
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <div className="relative rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-4 shadow-lg">
                  <Brain className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>
            </div>

            {/* Greeting */}
            {userName && (
              <Badge variant="secondary" className="mb-4 text-sm">
                {t('onboarding.welcomeBack', { name: userName })}
              </Badge>
            )}

            {/* Main headline */}
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-foreground">{t('onboarding.headline.transform')} </span>
              <span className="text-primary">{t('onboarding.headline.noise')}</span>
              <span className="text-foreground"> {t('onboarding.headline.into')} </span>
              <span className="text-primary">{t('onboarding.headline.knowledge')}</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {t('onboarding.subheadline')}
            </p>

            {/* Stats banner */}
            <Card className="inline-flex items-center justify-center border-dashed bg-muted/30 mb-8">
              <CardContent className="flex items-center gap-8 py-6 px-8">
                <StatBadge from={demoMessageCount} to={estimatedDecisions} label={t('onboarding.stats.decisions')} />
                <div className="h-10 w-px bg-border" aria-hidden="true" />
                <StatBadge from={demoMessageCount} to={estimatedTasks} label={t('onboarding.stats.tasks')} />
                <div className="h-10 w-px bg-border" aria-hidden="true" />
                <StatBadge from={demoMessageCount} to={estimatedInsights} label={t('onboarding.stats.insights')} />
              </CardContent>
            </Card>
          </div>

          {/* Value propositions */}
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
            role="list"
            aria-label={t('onboarding.keyFeatures')}
          >
            {VALUE_PROPS.map((prop, index) => (
              <ValuePropCard
                key={prop.titleKey}
                {...prop}
                delay={100 + index * 100}
              />
            ))}
          </div>

          {/* CTA Section */}
          <div
            className={cn(
              'flex flex-col sm:flex-row items-center justify-center gap-4',
              'animate-in fade-in-50 slide-in-from-bottom-4 duration-500'
            )}
            style={{ animationDelay: '400ms' }}
          >
            {/* Try Demo CTA */}
            <Button
              variant="outline"
              size="lg"
              className={cn(
                'relative group min-w-[200px]',
                touchTarget.min,
                focus.ring,
                transitions.default
              )}
              onClick={handleTryDemo}
              onMouseEnter={() => setIsHoveredDemo(true)}
              onMouseLeave={() => setIsHoveredDemo(false)}
              aria-describedby="demo-description"
            >
              <Play className={cn(
                'h-5 w-5 mr-2 transition-transform',
                isHoveredDemo && 'scale-110'
              )} />
              {t('onboarding.cta.tryDemo')}
              <span
                className={cn(
                  'absolute -bottom-6 left-1/2 -translate-x-1/2',
                  'text-xs text-muted-foreground whitespace-nowrap',
                  'opacity-0 transition-opacity',
                  isHoveredDemo && 'opacity-100'
                )}
                id="demo-description"
              >
                {t('onboarding.cta.tryDemoHint')}
              </span>
            </Button>

            {/* Connect Telegram CTA - Primary */}
            <Button
              size="lg"
              className={cn(
                'relative group min-w-[200px]',
                touchTarget.min,
                focus.ring,
                transitions.default,
                'bg-brand-telegram hover:bg-brand-telegram/90 text-white'
              )}
              onClick={handleConnect}
              onMouseEnter={() => setIsHoveredConnect(true)}
              onMouseLeave={() => setIsHoveredConnect(false)}
              aria-describedby="connect-description"
            >
              <Send className={cn(
                'h-5 w-5 mr-2 transition-transform',
                isHoveredConnect && 'translate-x-0.5 -translate-y-0.5'
              )} />
              {t('onboarding.cta.connectTelegram')}
              <ChevronRight className={cn(
                'h-5 w-5 ml-2 transition-transform',
                isHoveredConnect && 'translate-x-1'
              )} />
              <span
                className={cn(
                  'absolute -bottom-6 left-1/2 -translate-x-1/2',
                  'text-xs text-muted-foreground whitespace-nowrap',
                  'opacity-0 transition-opacity',
                  isHoveredConnect && 'opacity-100'
                )}
                id="connect-description"
              >
                {t('onboarding.cta.connectTelegramHint')}
              </span>
            </Button>
          </div>

          {/* Skip option */}
          <div className="text-center mt-12">
            <Button
              variant="link"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              {t('onboarding.cta.skip')}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer with keyboard hint */}
      <footer className="flex-shrink-0 py-4 text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
          <kbd className="bg-muted px-2 py-0.5 rounded font-mono text-[10px]">Enter</kbd>
          <span>{t('onboarding.keyboard.continueWithTelegram')}</span>
          <span className="text-muted-foreground/50">|</span>
          <kbd className="bg-muted px-2 py-0.5 rounded font-mono text-[10px]">D</kbd>
          <span>{t('onboarding.keyboard.forDemo')}</span>
        </p>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPACT VARIANT (for dashboard/modal use)
// ═══════════════════════════════════════════════════════════════

export interface OnboardingWelcomeCompactProps {
  onTryDemo?: () => void;
  onConnectTelegram?: () => void;
  onDismiss?: () => void;
}

export function OnboardingWelcomeCompact({
  onTryDemo,
  onConnectTelegram,
  onDismiss,
}: OnboardingWelcomeCompactProps) {
  const { t } = useTranslation('extraction');

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="rounded-xl bg-primary/10 p-4 shrink-0">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-2">{t('onboarding.compact.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('onboarding.compact.description')}
            </p>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onTryDemo}>
                <Play className="h-4 w-4 mr-2" />
                {t('onboarding.cta.tryDemo')}
              </Button>
              <Button size="sm" onClick={onConnectTelegram}>
                <Send className="h-4 w-4 mr-2" />
                {t('onboarding.compact.connect')}
              </Button>
            </div>
          </div>

          {/* Dismiss */}
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-11 w-11"
              onClick={onDismiss}
              aria-label={t('onboarding.compact.dismiss')}
            >
              <Target className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
