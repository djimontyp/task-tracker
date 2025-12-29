// Components
export { PerformanceDashboard } from './components/PerformanceDashboard';
export { WebVitalsCards } from './components/WebVitalsCards';
export { WebVitalsChart } from './components/WebVitalsChart';
export { VitalsStatusBadge } from './components/VitalsStatusBadge';

// Hooks
export { useWebVitals, loadWebVitalsHistory, clearWebVitalsHistory } from './hooks/useWebVitals';

// Utils
export { VITALS_THRESHOLDS, getRating, formatValue, getRatingDescription } from './utils/thresholds';

// Types
export type {
  MetricName,
  MetricRating,
  NavigationType,
  WebVitalMetric,
  WebVitalsState,
  PerformanceHistoryEntry,
  VitalsThreshold,
  VitalsThresholds,
} from './types';
