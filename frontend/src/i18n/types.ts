/**
 * TypeScript type declarations for i18n
 * Provides compile-time checking for translation keys
 */
import 'react-i18next';

// Import translation types (will be checked against JSON files)
import type common from '../../public/locales/en/common.json';
import type settings from '../../public/locales/en/settings.json';
import type dashboard from '../../public/locales/en/dashboard.json';
import type messages from '../../public/locales/en/messages.json';
import type atoms from '../../public/locales/en/atoms.json';
import type topics from '../../public/locales/en/topics.json';
import type errors from '../../public/locales/en/errors.json';
import type validation from '../../public/locales/en/validation.json';
import type executiveSummary from '../../public/locales/en/executiveSummary.json';
import type autoApproval from '../../public/locales/en/autoApproval.json';
import type onboarding from '../../public/locales/en/onboarding.json';
import type taskMonitoring from '../../public/locales/en/taskMonitoring.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      settings: typeof settings;
      dashboard: typeof dashboard;
      messages: typeof messages;
      atoms: typeof atoms;
      topics: typeof topics;
      errors: typeof errors;
      validation: typeof validation;
      executiveSummary: typeof executiveSummary;
      autoApproval: typeof autoApproval;
      onboarding: typeof onboarding;
      taskMonitoring: typeof taskMonitoring;
    };
  }
}

// Language code type
export type LanguageCode = 'uk' | 'en';

// Default language
export const DEFAULT_LANGUAGE: LanguageCode = 'uk';

// Available languages
export const AVAILABLE_LANGUAGES: readonly { code: LanguageCode; label: string; nativeLabel: string }[] = [
  { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
] as const;
