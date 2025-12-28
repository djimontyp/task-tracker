/**
 * Noise Filtering Components
 *
 * Components for displaying and managing message signal/noise classification.
 *
 * @example
 * import {
 *   ScoreIndicator,
 *   ScoreBreakdown,
 *   SignalCard,
 *   NoiseCard,
 *   MessageCard,
 *   BulkActionBar,
 *   useBulkSelection,
 * } from '@/features/noise/components';
 */

// Score visualization
export {
  ScoreIndicator,
  SCORE_LEVELS,
  getScoreLevel,
  type ScoreIndicatorProps,
  type ScoreLevel,
} from './ScoreIndicator';

export {
  ScoreBreakdown,
  SCORE_FACTORS,
  type ScoreBreakdownProps,
  type ScoreFactors,
  type FactorId,
} from './ScoreBreakdown';

// Message cards
export {
  SignalCard,
  NoiseCard,
  MessageCard,
  type MessageData,
  type MessageCardProps,
} from './SignalNoiseCard';

// Bulk actions
export {
  BulkActionBar,
  useBulkSelection,
  type BulkActionBarProps,
} from './BulkActionBar';
