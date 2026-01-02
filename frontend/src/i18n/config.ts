import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

/**
 * i18n configuration for Pulse Radar
 * Supports: Ukrainian (default), English
 * Performance target: <100ms language switch
 */
i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'uk',
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'messages', 'atoms', 'topics', 'settings', 'errors', 'validation', 'executiveSummary', 'autoApproval', 'onboarding', 'taskMonitoring'],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for instant switching
    },
  });

export default i18n;
