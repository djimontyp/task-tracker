import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Download, Database, SkipForward, X, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { cn } from '@/shared/lib';
import type { ImportProgress as ImportProgressData, ImportStatus } from '../types';

export interface ImportProgressProps {
  /** Current progress data */
  progress: ImportProgressData | null;
  /** Current import status */
  status: ImportStatus;
  /** Callback to cancel import */
  onCancel?: () => void;
  /** Whether cancel is in progress */
  isCancelling?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Progress display for history import
 *
 * Features:
 * - Progress bar with percentage
 * - 3 metric cards: Fetched / Stored / Skipped
 * - Skipped explanation tooltip
 * - Elapsed time display
 * - Cancel button
 *
 * @example
 * <ImportProgress
 *   progress={progress}
 *   status="running"
 *   onCancel={() => cancelImport()}
 * />
 */
export function ImportProgress({
  progress,
  status,
  onCancel,
  isCancelling = false,
  className,
}: ImportProgressProps) {
  const { t } = useTranslation('onboarding');

  const elapsedFormatted = useMemo(() => {
    if (!progress?.elapsed_seconds) return '0:00';

    const minutes = Math.floor(progress.elapsed_seconds / 60);
    const seconds = progress.elapsed_seconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [progress?.elapsed_seconds]);

  const isActive = status === 'pending' || status === 'running';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isCancelled = status === 'cancelled';

  const getStatusIcon = () => {
    if (isActive) {
      return <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />;
    }
    if (isCompleted) {
      return <Download className="h-5 w-5 text-semantic-success" aria-hidden="true" />;
    }
    if (isFailed || isCancelled) {
      return <X className="h-5 w-5 text-semantic-error" aria-hidden="true" />;
    }
    return <Loader2 className="h-5 w-5" aria-hidden="true" />;
  };

  const getStatusTitle = () => {
    if (isActive) return t('import.progress.importing');
    if (isCompleted) return t('import.progress.completed');
    if (isFailed) return t('import.progress.failed');
    if (isCancelled) return t('import.progress.cancelled');
    return t('import.progress.pending');
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <CardTitle>{getStatusTitle()}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('import.progress.progress')}</span>
            <span className="font-medium">{progress?.progress_percent ?? 0}%</span>
          </div>
          <Progress
            value={progress?.progress_percent ?? 0}
            className={cn(
              'h-3',
              isFailed && '[&>div]:bg-semantic-error',
              isCancelled && '[&>div]:bg-muted-foreground'
            )}
            aria-label={t('import.progress.progressLabel', {
              percent: progress?.progress_percent ?? 0,
            })}
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            icon={Download}
            label={t('import.progress.fetched')}
            value={progress?.fetched ?? 0}
            description={t('import.progress.fetchedDesc')}
          />
          <MetricCard
            icon={Database}
            label={t('import.progress.stored')}
            value={progress?.stored ?? 0}
            description={t('import.progress.storedDesc')}
          />
          <MetricCard
            icon={SkipForward}
            label={t('import.progress.skipped')}
            value={progress?.skipped ?? 0}
            description={t('import.progress.skippedDesc')}
            hasTooltip
            tooltipContent={t('import.progress.skippedTooltip')}
          />
        </div>

        {/* Elapsed Time */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t('import.progress.elapsed')}</span>
          <span className="font-mono">{elapsedFormatted}</span>
        </div>

        {/* Error Message */}
        {isFailed && progress?.error_message && (
          <div className="p-4 rounded-lg bg-semantic-error/10 border border-semantic-error/20">
            <p className="text-sm text-semantic-error">{progress.error_message}</p>
          </div>
        )}

        {/* Cancel Button - 44px touch target */}
        {isActive && onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isCancelling}
            className="w-full h-11"
          >
            {isCancelling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                {t('import.actions.cancelling')}
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" aria-hidden="true" />
                {t('import.actions.cancel')}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// METRIC CARD COMPONENT
// ═══════════════════════════════════════════════════════════════

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  description: string;
  hasTooltip?: boolean;
  tooltipContent?: string;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  hasTooltip = false,
  tooltipContent,
}: MetricCardProps) {
  const content = (
    <div className="flex flex-col items-center p-4 rounded-lg border bg-muted/30">
      <Icon className="h-5 w-5 text-muted-foreground mb-2" aria-hidden="true" />
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {hasTooltip && (
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden="true" />
        )}
      </div>
      <span className="text-2xl font-bold">{value.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </div>
  );

  if (hasTooltip && tooltipContent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
