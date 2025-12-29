/**
 * Core Web Vitals metric types following web-vitals library conventions
 * @see https://web.dev/vitals/
 */

export type MetricName = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';

export type MetricRating = 'good' | 'needs-improvement' | 'poor';

export type NavigationType = 'navigate' | 'reload' | 'back-forward' | 'prerender';

export interface WebVitalMetric {
  name: MetricName;
  value: number;
  rating: MetricRating;
  delta: number;
  id: string;
  navigationType: NavigationType;
  timestamp: number;
}

export interface WebVitalsState {
  LCP: WebVitalMetric | null;
  INP: WebVitalMetric | null;
  CLS: WebVitalMetric | null;
  FCP: WebVitalMetric | null;
  TTFB: WebVitalMetric | null;
  lastUpdated: number | null;
}

export interface PerformanceHistoryEntry {
  timestamp: number;
  LCP?: number;
  INP?: number;
  CLS?: number;
  FCP?: number;
  TTFB?: number;
}

export interface VitalsThreshold {
  good: number;
  poor: number;
  unit: string;
  label: string;
}

export type VitalsThresholds = Record<MetricName, VitalsThreshold>;
