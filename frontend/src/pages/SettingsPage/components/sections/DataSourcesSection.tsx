/**
 * DataSourcesSection - Data source integrations (Telegram, Slack, Email, Jira)
 *
 * Shows available data sources and their connection status.
 * Uses existing TelegramCard component with full toggle/settings functionality.
 * Other sources are "coming soon" with disabled state.
 */

import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';

import { SettingsSection } from '../SettingsSection';
import { SettingsCard } from '../SettingsCard';
import { SlackIcon, JiraIcon } from '@/shared/icons';

// Import existing Telegram card (has all logic: toggle, confirm dialog, settings sheet)
import TelegramCard from '../../plugins/TelegramSource/TelegramCard';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function DataSourcesSection() {
  const { t } = useTranslation('settings');

  return (
    <SettingsSection title={t('sections.dataSources')}>
      {/* Telegram - uses existing TelegramCard with full functionality */}
      <TelegramCard />

      {/* Jira - coming soon */}
      <SettingsCard
        icon={JiraIcon}
        title="Jira"
        description={t('dataSources.jira.description')}
        status="disabled"
        statusLabel={t('status.soon')}
      />

      {/* Slack - coming soon */}
      <SettingsCard
        icon={SlackIcon}
        title="Slack"
        description={t('dataSources.slack.description')}
        status="disabled"
        statusLabel={t('status.soon')}
      />

      {/* Email - coming soon */}
      <SettingsCard
        icon={Mail}
        title="Email"
        description={t('dataSources.email.description')}
        status="disabled"
        statusLabel={t('status.soon')}
      />
    </SettingsSection>
  );
}
