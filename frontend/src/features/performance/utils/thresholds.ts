/**
 * Web Vitals thresholds per Google's Core Web Vitals guidelines
 * @see https://web.dev/vitals/
 */

import type { MetricName, MetricRating, VitalsThresholds } from '../types';

export const VITALS_THRESHOLDS: VitalsThresholds = {
  LCP: { good: 2500, poor: 4000, unit: 'ms', label: 'Largest Contentful Paint' },
  INP: { good: 200, poor: 500, unit: 'ms', label: 'Interaction to Next Paint' },
  CLS: { good: 0.1, poor: 0.25, unit: '', label: 'Cumulative Layout Shift' },
  FCP: { good: 1800, poor: 3000, unit: 'ms', label: 'First Contentful Paint' },
  TTFB: { good: 800, poor: 1800, unit: 'ms', label: 'Time to First Byte' },
} as const;

/**
 * Get the rating for a metric value based on thresholds
 */
export const getRating = (name: MetricName, value: number): MetricRating => {
  const threshold = VITALS_THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

/**
 * Format a metric value for display
 */
export const formatValue = (name: MetricName, value: number): string => {
  const threshold = VITALS_THRESHOLDS[name];
  if (name === 'CLS') return value.toFixed(3);
  return `${Math.round(value)}${threshold.unit}`;
};

/**
 * Get description for a rating
 */
export const getRatingDescription = (rating: MetricRating): string => {
  switch (rating) {
    case 'good':
      return 'Excellent user experience';
    case 'needs-improvement':
      return 'Acceptable but could be better';
    case 'poor':
      return 'Poor user experience, action required';
  }
};
