/**
 * Types for Settings Page
 *
 * Shared interfaces for settings components.
 */

import type { ComponentType, ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════
// STATUS TYPES
// ═══════════════════════════════════════════════════════════════

export type SettingStatus =
  | 'connected'
  | 'active'
  | 'pending'
  | 'error'
  | 'disabled'
  | 'loading';

// ═══════════════════════════════════════════════════════════════
// CARD TYPES
// ═══════════════════════════════════════════════════════════════

export interface SettingsCardConfig {
  id: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  status?: SettingStatus;
  statusLabel?: string;
  onClick?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// INTEGRATION TYPES (Sources + Providers)
// ═══════════════════════════════════════════════════════════════

export interface IntegrationConfig {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
  type: 'source' | 'provider';
  status: SettingStatus;
  statusLabel?: string;
  metadata?: Record<string, string | number>;
}

// ═══════════════════════════════════════════════════════════════
// SECTION TYPES
// ═══════════════════════════════════════════════════════════════

export interface SettingsSectionConfig {
  id: string;
  title: string;
  description?: string;
  cards: SettingsCardConfig[];
}

// ═══════════════════════════════════════════════════════════════
// SHEET TYPES
// ═══════════════════════════════════════════════════════════════

export interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}
