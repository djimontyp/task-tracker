/**
 * Executive Summary Types
 *
 * T027: TypeScript types for Executive Summary feature.
 * Based on backend schemas in backend/app/api/v1/schemas/executive_summary.py
 */

/**
 * Minimal topic information for embedding in responses.
 */
export interface TopicBrief {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

/**
 * Aggregate statistics for the summary period.
 */
export interface ExecutiveSummaryStats {
  decisions_count: number;
  blockers_count: number;
  active_topics_count: number;
  stale_blockers_count: number;
}

/**
 * Atom with executive summary context.
 */
export interface ExecutiveSummaryAtom {
  id: string;
  type: 'decision' | 'blocker';
  title: string;
  content: string;
  created_at: string;
  topic: TopicBrief | null;
  days_old: number;
  is_stale: boolean;
  source_message_id: string | null;
}

/**
 * Decisions grouped under a topic.
 */
export interface TopicDecisions {
  topic: TopicBrief;
  decisions: ExecutiveSummaryAtom[];
  count: number;
}

/**
 * Complete executive summary response.
 */
export interface ExecutiveSummaryResponse {
  period_days: number;
  period_start: string;
  period_end: string;
  period_label: string;
  stats: ExecutiveSummaryStats;
  blockers: ExecutiveSummaryAtom[];
  decisions_by_topic: TopicDecisions[];
  uncategorized_decisions: ExecutiveSummaryAtom[];
  generated_at: string;
}

/**
 * Lightweight stats-only response.
 */
export interface ExecutiveSummaryStatsResponse {
  period_days: number;
  period_label: string;
  stats: ExecutiveSummaryStats;
  generated_at: string;
}

/**
 * Summary period options.
 */
export type SummaryPeriod = 7 | 14 | 30;

/**
 * Export format options.
 */
export type ExportFormat = 'markdown' | 'plain_text';

/**
 * Export request configuration.
 */
export interface ExportRequest {
  period_days?: number;
  format?: ExportFormat;
  include_stats?: boolean;
  include_blockers?: boolean;
  include_decisions?: boolean;
}

/**
 * Export response with formatted content.
 */
export interface ExportResponse {
  content: string;
  format: ExportFormat;
  filename: string;
  generated_at: string;
}

/**
 * Period option for selector.
 */
export interface PeriodOption {
  value: SummaryPeriod;
  label: string;
}

/**
 * Available period options.
 */
export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 7, label: 'Останній тиждень' },
  { value: 14, label: 'Останні 2 тижні' },
  { value: 30, label: 'Останній місяць' },
];

/**
 * Local storage key for period preference.
 */
export const PERIOD_STORAGE_KEY = 'executive-summary-period';
