/**
 * Types for History Import feature
 *
 * @see .obsidian-docs/дослідження/Cold_Start_Feature_Research.md
 */

// ═══════════════════════════════════════════════════════════════
// IMPORT DEPTH OPTIONS
// ═══════════════════════════════════════════════════════════════

export type ImportDepth = 'skip' | '24h' | '7d' | '30d' | 'all';

export interface ImportDepthOption {
  value: ImportDepth;
  labelKey: string;
  descriptionKey?: string;
  isRecommended?: boolean;
  isWarning?: boolean;
}

export const IMPORT_DEPTH_OPTIONS: ImportDepthOption[] = [
  { value: 'skip', labelKey: 'import.depth.skip' },
  { value: '24h', labelKey: 'import.depth.24h' },
  { value: '7d', labelKey: 'import.depth.7d', isRecommended: true },
  { value: '30d', labelKey: 'import.depth.30d' },
  { value: 'all', labelKey: 'import.depth.all', isWarning: true },
];

// ═══════════════════════════════════════════════════════════════
// MESSAGE ESTIMATE
// ═══════════════════════════════════════════════════════════════

export interface MessageEstimate {
  depth: ImportDepth;
  count: number;
}

export interface MessageEstimateResponse {
  estimates: MessageEstimate[];
  total_groups: number;
  last_updated: string;
}

export interface MessageEstimateError {
  code: 'rate_limited' | 'connection_error' | 'unknown';
  message: string;
  retry_after?: number;
}

// ═══════════════════════════════════════════════════════════════
// IMPORT PROGRESS
// ═══════════════════════════════════════════════════════════════

export type ImportStatus = 'idle' | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ImportProgress {
  status: ImportStatus;
  progress_percent: number;
  fetched: number;
  stored: number;
  skipped: number;
  elapsed_seconds: number;
  error_message?: string;
}

export interface ImportJobResponse {
  job_id: string;
  status: ImportStatus;
  depth: ImportDepth;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// WEBSOCKET EVENTS
// ═══════════════════════════════════════════════════════════════

export interface ImportProgressEvent {
  type: 'import_progress';
  job_id: string;
  progress: ImportProgress;
}

export interface ImportCompletedEvent {
  type: 'import_completed';
  job_id: string;
  summary: {
    total_fetched: number;
    total_stored: number;
    total_skipped: number;
    duration_seconds: number;
  };
}

export interface ImportFailedEvent {
  type: 'import_failed';
  job_id: string;
  error: string;
}

export type ImportWebSocketEvent =
  | ImportProgressEvent
  | ImportCompletedEvent
  | ImportFailedEvent;

// ═══════════════════════════════════════════════════════════════
// API REQUEST/RESPONSE
// ═══════════════════════════════════════════════════════════════

export interface StartImportRequest {
  depth: ImportDepth;
  chat_ids: string[];
}

export interface CancelImportRequest {
  job_id: string;
}
