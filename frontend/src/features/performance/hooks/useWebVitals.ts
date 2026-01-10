import { useEffect, useState, useCallback } from 'react';
import { onLCP, onINP, onCLS, onFCP, onTTFB, type Metric } from 'web-vitals';
import { logger } from '@/shared/utils/logger';
import type { WebVitalsState, WebVitalMetric, MetricName, NavigationType } from '../types';

const STORAGE_KEY = 'pulse-radar-web-vitals';

/**
 * Hook to collect and track Core Web Vitals metrics
 *
 * Tracks: LCP, INP, CLS, FCP, TTFB
 * Persists history to localStorage for trend visualization
 */
export const useWebVitals = () => {
  const [vitals, setVitals] = useState<WebVitalsState>({
    LCP: null,
    INP: null,
    CLS: null,
    FCP: null,
    TTFB: null,
    lastUpdated: null,
  });

  const handleMetric = useCallback((metric: Metric) => {
    const webVital: WebVitalMetric = {
      name: metric.name as MetricName,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType as NavigationType,
      timestamp: Date.now(),
    };

    logger.debug(`[WebVitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
    });

    setVitals((prev) => ({
      ...prev,
      [metric.name]: webVital,
      lastUpdated: Date.now(),
    }));

    // Persist to localStorage for history
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const history: Array<{ name: string; value: number; timestamp: number }> = stored
        ? JSON.parse(stored)
        : [];
      history.push({ name: metric.name, value: metric.value, timestamp: Date.now() });
      // Keep last 100 entries
      if (history.length > 100) history.shift();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      logger.warn('[WebVitals] Failed to persist metrics:', error);
    }
  }, []);

  useEffect(() => {
    // Register all Core Web Vitals observers
    // Using reportAllChanges: true for metrics that can report preliminary values
    // INP excluded - it requires user interaction and doesn't support reportAllChanges well
    const reportAllOptions = { reportAllChanges: true };

    onLCP(handleMetric, reportAllOptions);
    onINP(handleMetric); // INP only fires after user interaction - no reportAllChanges
    onCLS(handleMetric, reportAllOptions);
    onFCP(handleMetric, reportAllOptions);
    onTTFB(handleMetric, reportAllOptions);

    // Note: web-vitals callbacks don't return cleanup functions
    // The observers are automatically cleaned up when the page unloads
  }, [handleMetric]);

  return vitals;
};

/**
 * Load Web Vitals history from localStorage
 */
export const loadWebVitalsHistory = (): Array<{ name: string; value: number; timestamp: number }> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Clear Web Vitals history from localStorage
 */
export const clearWebVitalsHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
