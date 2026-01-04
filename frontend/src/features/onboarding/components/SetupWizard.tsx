import { useTranslation } from 'react-i18next';
import { MessageSquare, FolderPlus, Bot, Lightbulb } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { SetupStep } from './SetupStep';
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
  step1Status,
  step2Status,
  step3Status,
  step4Status,
  onConnectSource,
  onCreateProject,
  onActivateAgent,
}: SetupWizardProps) {
  const { t } = useTranslation('onboarding');

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
        {step1Status === 'active' && onConnectSource && (
          <Button onClick={onConnectSource} className="h-11">
            {t('wizard.actions.connectSource')}
          </Button>
        )}
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
