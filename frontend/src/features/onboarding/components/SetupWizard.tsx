import { useTranslation } from 'react-i18next';
import { MessageSquare, FolderPlus, Bot, Lightbulb, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { SetupStep } from './SetupStep';
import { useTelegramStore } from '@/pages/SettingsPage/plugins/TelegramSource/useTelegramStore';
import type { SetupWizardProps } from '../types/wizard';

/**
 * SetupWizard - Inline grid wizard for Dashboard cold start state
 *
 * Layout:
 * - 2x2 grid on desktop (md+)
 * - 1 column on mobile
 *
 * Steps:
 * 1. Connect Sources - Link Telegram/Slack
 * 2. First Project - Create organizational structure
 * 3. Activate Agent - Enable AI analysis
 * 4. First Insight - See first extracted knowledge (auto-completes)
 *
 * Design System compliance:
 * - Semantic tokens only (no raw Tailwind colors)
 * - 4px grid spacing (gap-4, gap-6)
 * - 44px touch targets (h-11)
 * - Status: icon + text (not color only)
 */
export function SetupWizard({
  step2Status,
  step3Status,
  step4Status,
  onConnectSource,
  onCreateProject,
  onActivateAgent,
  collapsed = false,
}: SetupWizardProps & { collapsed?: boolean }) {
  const { t } = useTranslation('onboarding');
  const { connectionStatus } = useTelegramStore();

  // Derive step1 status from real Telegram connection state
  const telegramConnected = connectionStatus === 'connected' || connectionStatus === 'warning';
  const step1Status = telegramConnected ? 'completed' : 'active';

  const handleSlackClick = () => {
    toast.info(t('wizard.actions.slackComingSoon'));
  };

  if (collapsed) {
    return (
      <div className="w-full bg-gradient-to-r from-status-connected/10 to-transparent border border-status-connected/20 rounded-lg p-4 mb-6 flex items-center gap-4 animate-fade-in">
        <div className="h-8 w-8 rounded-full bg-status-connected/20 flex items-center justify-center shrink-0">
          <Check className="h-4 w-4 text-status-connected" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-foreground">
            {t('steps.complete.title', 'All set!')}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <Loader2 className="h-3 w-3 text-status-connected animate-spin" />
            <p className="text-xs text-muted-foreground">
              {t('steps.complete.content', 'System is analyzing data...')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
      {/* Step 1: Connect Sources */}
      <SetupStep
        stepNumber={1}
        title={t('wizard.setupStep.1.title')}
        description={t('wizard.setupStep.1.description')}
        status={step1Status}
        icon={<MessageSquare className="h-6 w-6" />}
      >
        <div className="flex gap-2">
          <Button
            onClick={onConnectSource}
            variant={telegramConnected ? 'outline' : 'default'}
            className="h-11"
          >
            {telegramConnected && <Check className="mr-2 h-4 w-4" />}
            {t('wizard.actions.telegram')}
          </Button>
          <Button
            onClick={handleSlackClick}
            variant="outline"
            disabled
            className="h-11"
          >
            {t('wizard.actions.slack')}
          </Button>
        </div>
      </SetupStep>

      {/* Step 2: First Project */}
      <SetupStep
        stepNumber={2}
        title={t('wizard.setupStep.2.title')}
        description={t('wizard.setupStep.2.description')}
        status={step2Status}
        icon={<FolderPlus className="h-6 w-6" />}
      >
        {step2Status === 'active' && onCreateProject && (
          <Button onClick={onCreateProject} className="h-11">
            {t('wizard.actions.createProject')}
          </Button>
        )}
      </SetupStep>

      {/* Step 3: Activate Agent */}
      <SetupStep
        stepNumber={3}
        title={t('wizard.setupStep.3.title')}
        description={t('wizard.setupStep.3.description')}
        status={step3Status}
        icon={<Bot className="h-6 w-6" />}
      >
        {step3Status === 'active' && onActivateAgent && (
          <Button onClick={onActivateAgent} className="h-11">
            {t('wizard.actions.activateAgent')}
          </Button>
        )}
      </SetupStep>

      {/* Step 4: First Insight */}
      <SetupStep
        stepNumber={4}
        title={t('wizard.setupStep.4.title')}
        description={t('wizard.setupStep.4.description')}
        status={step4Status}
        icon={<Lightbulb className="h-6 w-6" />}
      />
    </div>
  );
}
