import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useUiStore, type LanguageCode } from '@/shared/store/uiStore';
import { apiClient } from '@/shared/lib/api/client';

const AVAILABLE_LANGUAGES: readonly { code: LanguageCode; label: string; nativeLabel: string }[] = [
  { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
] as const;

const SYNC_DEBOUNCE_MS = 500;

/**
 * Hook for managing UI language
 * - Syncs with i18next for instant UI updates
 * - Persists to localStorage via Zustand
 * - Debounced sync to backend for cross-device persistence
 */
export function useLanguage() {
  const { i18n } = useTranslation();
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync i18n language on mount (in case localStorage has different value)
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [i18n, language]);

  // Debounced backend sync
  const syncToBackend = useCallback(async (lang: LanguageCode) => {
    try {
      await apiClient.patch('/api/v1/users/me', { ui_language: lang });
    } catch (error) {
      console.error('Failed to sync language preference to backend:', error);
    }
  }, []);

  const changeLanguage = useCallback((lang: LanguageCode) => {
    // Instant UI update
    i18n.changeLanguage(lang);
    setLanguage(lang);

    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounced backend sync
    syncTimeoutRef.current = setTimeout(() => {
      syncToBackend(lang);
    }, SYNC_DEBOUNCE_MS);
  }, [i18n, setLanguage, syncToBackend]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    language,
    setLanguage: changeLanguage,
    availableLanguages: AVAILABLE_LANGUAGES,
    isUkrainian: language === 'uk',
    isEnglish: language === 'en',
  };
}

export { AVAILABLE_LANGUAGES };
export type { LanguageCode };
