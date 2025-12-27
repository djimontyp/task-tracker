/**
 * TypeScript Contracts: i18n Feature
 * Feature: 005-i18n
 * Date: 2025-12-14
 *
 * This file defines TypeScript types for the i18n feature.
 * Generated from OpenAPI spec and research decisions.
 */

// =============================================================================
// Language Types
// =============================================================================

/**
 * Supported language codes (ISO 639-1)
 */
export type LanguageCode = 'uk' | 'en';

/**
 * Default language for the application
 */
export const DEFAULT_LANGUAGE: LanguageCode = 'uk';

/**
 * Available languages configuration
 */
export const AVAILABLE_LANGUAGES: readonly { code: LanguageCode; label: string; nativeLabel: string }[] = [
  { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
] as const;

// =============================================================================
// User Types (Extended)
// =============================================================================

/**
 * User response with language preference
 */
export interface UserResponse {
  id: number;
  first_name: string;
  last_name: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_bot: boolean;
  ui_language: LanguageCode;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * User update request (partial)
 */
export interface UserUpdateRequest {
  first_name?: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  ui_language?: LanguageCode;
}

// =============================================================================
// Project Types (Extended)
// =============================================================================

/**
 * Project configuration with language setting
 */
export interface ProjectConfigPublic {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  glossary: Record<string, string>;
  components: Record<string, unknown>[];
  default_assignee_ids: number[];
  is_active: boolean;
  priority_rules: Record<string, unknown>;
  version: string;
  language: LanguageCode;
  created_at: string;
  updated_at: string;
}

/**
 * Project creation request
 */
export interface ProjectConfigCreate {
  name: string;
  description: string;
  keywords: string[];
  glossary?: Record<string, string>;
  components?: Record<string, unknown>[];
  default_assignee_ids?: number[];
  pm_user_id: number;
  is_active?: boolean;
  priority_rules?: Record<string, unknown>;
  version?: string;
  language?: LanguageCode;
}

/**
 * Project update request (partial)
 */
export interface ProjectConfigUpdate {
  name?: string;
  description?: string;
  keywords?: string[];
  glossary?: Record<string, string>;
  components?: Record<string, unknown>[];
  default_assignee_ids?: number[];
  pm_user_id?: number;
  is_active?: boolean;
  priority_rules?: Record<string, unknown>;
  version?: string;
  language?: LanguageCode;
}

// =============================================================================
// i18n Store Types
// =============================================================================

/**
 * Language state in Zustand store
 */
export interface LanguageState {
  /** Current UI language */
  language: LanguageCode;
  /** Update language (triggers i18n.changeLanguage + localStorage persist) */
  setLanguage: (lang: LanguageCode) => void;
}

// =============================================================================
// Translation Namespace Types
// =============================================================================

/**
 * Available translation namespaces
 */
export type TranslationNamespace =
  | 'common'
  | 'dashboard'
  | 'messages'
  | 'atoms'
  | 'topics'
  | 'settings'
  | 'errors'
  | 'validation';

/**
 * Namespace-specific translation structure (common namespace example)
 */
export interface CommonTranslations {
  actions: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    close: string;
    confirm: string;
    back: string;
    next: string;
    submit: string;
    reset: string;
    refresh: string;
    search: string;
    filter: string;
    sort: string;
    export: string;
    import: string;
  };
  navigation: {
    dashboard: string;
    messages: string;
    topics: string;
    atoms: string;
    tasks: string;
    analysis: string;
    proposals: string;
    agents: string;
    providers: string;
    projects: string;
    settings: string;
  };
  status: {
    loading: string;
    saving: string;
    success: string;
    error: string;
    pending: string;
    completed: string;
    failed: string;
  };
  labels: {
    name: string;
    description: string;
    status: string;
    type: string;
    created: string;
    updated: string;
    language: string;
  };
}

/**
 * Atom translations namespace
 */
export interface AtomsTranslations {
  type: {
    task: string;
    idea: string;
    question: string;
    decision: string;
    insight: string;
  };
  status: {
    draft: string;
    pending_review: string;
    approved: string;
    rejected: string;
  };
  actions: {
    create: string;
    edit: string;
    delete: string;
    approve: string;
    reject: string;
    archive: string;
  };
  messages: {
    created: string;
    updated: string;
    deleted: string;
    approved: string;
    rejected: string;
  };
  plurals: {
    atom_one: string;
    atom_few: string;
    atom_many: string;
  };
}

/**
 * Settings translations namespace
 */
export interface SettingsTranslations {
  tabs: {
    general: string;
    sources: string;
    providers: string;
    prompts: string;
  };
  general: {
    title: string;
    appearance: {
      title: string;
      description: string;
      theme: string;
      light: string;
      dark: string;
      system: string;
    };
    language: {
      title: string;
      description: string;
    };
    admin: {
      title: string;
      description: string;
      enable: string;
      shortcut: string;
    };
  };
}

// =============================================================================
// i18next Module Augmentation (for type-safe translations)
// =============================================================================

/**
 * Type augmentation for react-i18next
 * This provides autocomplete for translation keys
 */
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    ns: TranslationNamespace[];
    resources: {
      common: CommonTranslations;
      atoms: AtomsTranslations;
      settings: SettingsTranslations;
      // Add other namespaces as implemented
    };
  }
}
