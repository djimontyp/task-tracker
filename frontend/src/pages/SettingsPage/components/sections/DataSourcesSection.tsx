/**
 * DataSourcesSection - Data source integrations (Telegram, Slack, etc.)
 *
 * Shows available data sources and their connection status.
 * Uses existing TelegramCard component with full toggle/settings functionality.
 */

import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';

import { SettingsSection } from '../SettingsSection';
import { SettingsCard } from '../SettingsCard';

// Import existing Telegram card (has all logic: toggle, confirm dialog, settings sheet)
import TelegramCard from '../../plugins/TelegramSource/TelegramCard';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function DataSourcesSection() {
  const { t } = useTranslation('settings');

  return (
    <SettingsSection title={t('sections.dataSources', 'Data Sources')}>
      {/* Telegram - uses existing TelegramCard with full functionality */}
      <TelegramCard />

      {/* Slack - coming soon */}
      <SettingsCard
        icon={MessageSquare}
        title="Slack"
        description={t('sources.slack.comingSoon', 'Coming soon')}
        status="disabled"
        statusLabel={t('status.soon', 'Soon')}
      />
    </SettingsSection>
  );
}
