/**
 * SettingsPage - 3-column settings layout
 *
 * Single screen design (no scroll on 1080p desktop):
 * - General: Appearance, Language, Admin Mode
 * - Data Sources: Telegram, Slack (coming soon)
 * - AI Providers: OpenAI, Ollama
 *
 * Mobile: columns stack vertically
 */

import { useTranslation } from 'react-i18next';

import { PageWrapper } from '@/shared/primitives';

import {
  GeneralSection,
  DataSourcesSection,
  AIProvidersSection,
} from './components/sections';

const SettingsPage = () => {
  const { t } = useTranslation('settings');

  return (
    <PageWrapper variant="fullWidth">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          {t('page.title', 'Settings')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('page.description', 'Configure your app preferences and integrations')}
        </p>
      </div>

      {/* 3-column grid - responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {/* Column 1: General */}
        <GeneralSection />

        {/* Column 2: Data Sources */}
        <DataSourcesSection />

        {/* Column 3: AI Providers */}
        <AIProvidersSection />
      </div>
    </PageWrapper>
  );
};

export default SettingsPage;
