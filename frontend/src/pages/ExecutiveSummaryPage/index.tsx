/**
 * ExecutiveSummaryPage
 *
 * T033: Main page component for Executive Summary.
 * Displays weekly/bi-weekly/monthly summary of decisions and blockers for CEO.
 */

import { useTranslation } from 'react-i18next';
import { ClipboardList, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { PageWrapper } from '@/shared/primitives';
import { useExecutiveSummary } from './hooks/useExecutiveSummary';
import { SummaryStats } from './components/SummaryStats';
import { BlockersList } from './components/BlockersList';
import { DecisionsList } from './components/DecisionsList';
import { SummaryPeriodSelector } from './components/SummaryPeriodSelector';
import { ExportButton } from './components/ExportButton';

export function ExecutiveSummaryPage() {
  const { t } = useTranslation('executiveSummary');
  const {
    data,
    isLoading,
    isFetching,
    error,
    period,
    setPeriod,
    refetch,
    exportSummary,
    isExporting,
    periodOptions,
  } = useExecutiveSummary();

  return (
    <PageWrapper variant="fullWidth">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <SummaryPeriodSelector
            value={period}
            onChange={setPeriod}
            options={periodOptions}
            disabled={isLoading}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label={t('actions.refresh')}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
          </Button>
          <ExportButton
            onExport={exportSummary}
            isExporting={isExporting}
            disabled={isLoading || !data}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data ? (
        <div className="space-y-6">
          <SummaryStats stats={data.stats} periodLabel={data.period_label} />

          {data.stats.blockers_count === 0 &&
          data.stats.decisions_count === 0 ? (
            <EmptyState period={period} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <BlockersList blockers={data.blockers} />
              <DecisionsList
                decisionsByTopic={data.decisions_by_topic}
                uncategorizedDecisions={data.uncategorized_decisions}
              />
            </div>
          )}
        </div>
      ) : null}
    </PageWrapper>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  const { t } = useTranslation('executiveSummary');

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <ClipboardList className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-medium">{t('errors.loadingFailed')}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        {error.message || t('errors.tryAgain')}
      </p>
      <Button onClick={onRetry} className="mt-4">
        {t('errors.retryButton')}
      </Button>
    </div>
  );
}

interface EmptyStateProps {
  period: number;
}

function EmptyState({ period }: EmptyStateProps) {
  const { t } = useTranslation('executiveSummary');
  const periodKey =
    period === 7
      ? 'week'
      : period === 14
        ? 'twoWeeks'
        : 'month';

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">{t('empty.title')}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        {t('empty.description', { period: t(`empty.periods.${periodKey}`) })}
      </p>
    </div>
  );
}

export default ExecutiveSummaryPage;
