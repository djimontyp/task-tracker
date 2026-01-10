import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WebVitalsCards } from './WebVitalsCards';
import { WebVitalsChart } from './WebVitalsChart';
import { useWebVitals, loadWebVitalsHistory, clearWebVitalsHistory } from '../hooks/useWebVitals';
import { getLocaleString } from '@/shared/utils/date';
import type { PerformanceHistoryEntry } from '../types';
import { RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export const PerformanceDashboard = () => {
  const { t, i18n } = useTranslation('monitoring');
  const vitals = useWebVitals();
  const [history, setHistory] = useState<PerformanceHistoryEntry[]>([]);

  useEffect(() => {
    // Load history from localStorage and group by timestamp
    const entries = loadWebVitalsHistory();

    // Take only the last 30 measurements to keep chart readable and continuous
    // Sort by timestamp descending, take last 30, then the grouping will handle the rest
    const recentEntries = entries.slice(-90); // ~30 grouped entries (3 metrics per page load)

    // Group entries by timestamp (within 1 second window)
    const grouped = recentEntries.reduce<PerformanceHistoryEntry[]>((acc, entry) => {
      const existing = acc.find((e) => Math.abs(e.timestamp - entry.timestamp) < 1000);
      if (existing) {
        // Use type assertion via unknown for dynamic property assignment
        const key = entry.name as keyof PerformanceHistoryEntry;
        if (key !== 'timestamp') {
          (existing as unknown as Record<string, number>)[key] = entry.value;
        }
      } else {
        acc.push({
          timestamp: entry.timestamp,
          [entry.name]: entry.value,
        } as PerformanceHistoryEntry);
      }
      return acc;
    }, []);

    setHistory(grouped);
  }, [vitals.lastUpdated]);

  const handleClearHistory = () => {
    clearWebVitalsHistory();
    setHistory([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8" aria-hidden="true" />
            {t('performance.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('performance.description')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {vitals.lastUpdated && (
            <span className="text-sm text-muted-foreground">
              {t('performance.lastUpdated', { time: new Date(vitals.lastUpdated).toLocaleTimeString(getLocaleString(i18n.language)) })}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleClearHistory}>
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            {t('performance.clearHistory')}
          </Button>
        </div>
      </div>

      <WebVitalsCards vitals={vitals} />

      <WebVitalsChart data={history} />

      {/* Thresholds Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full bg-semantic-success"
            aria-hidden="true"
          />
          <span>{t('performance.legend.good')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full bg-semantic-warning"
            aria-hidden="true"
          />
          <span>{t('performance.legend.needsImprovement')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full bg-semantic-error"
            aria-hidden="true"
          />
          <span>{t('performance.legend.poor')}</span>
        </div>
      </div>
    </div>
  );
};
