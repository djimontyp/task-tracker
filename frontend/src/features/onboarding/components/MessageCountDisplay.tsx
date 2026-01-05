import { useTranslation } from 'react-i18next';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/lib';

export interface MessageCountDisplayProps {
  /** Message count to display */
  count: number | null;
  /** Whether estimate is loading */
  isLoading?: boolean;
  /** Whether there was an error fetching */
  isError?: boolean;
  /** Whether rate limited */
  isRateLimited?: boolean;
  /** Seconds until rate limit expires */
  retryAfter?: number | null;
  /** Callback to retry fetching */
  onRetry?: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * Displays message count estimate or error state
 *
 * @example
 * <MessageCountDisplay
 *   count={312}
 *   isLoading={false}
 * />
 *
 * @example
 * <MessageCountDisplay
 *   count={null}
 *   isError
 *   isRateLimited
 *   retryAfter={42}
 *   onRetry={refetch}
 * />
 */
export function MessageCountDisplay({
  count,
  isLoading = false,
  isError = false,
  isRateLimited = false,
  retryAfter,
  onRetry,
  className,
}: MessageCountDisplayProps) {
  const { t } = useTranslation('onboarding');

  if (isLoading) {
    return (
      <Skeleton
        className={cn('h-4 w-20 inline-block', className)}
        aria-label={t('import.estimate.loading')}
      />
    );
  }

  if (isError) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-sm text-muted-foreground',
          className
        )}
      >
        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t('import.estimate.unavailable')}</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onRetry}
            aria-label={
              isRateLimited && retryAfter
                ? t('import.estimate.retryIn', { seconds: retryAfter })
                : t('import.estimate.retry')
            }
          >
            <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />
            {isRateLimited && retryAfter
              ? t('import.estimate.retryIn', { seconds: retryAfter })
              : t('import.estimate.retry')}
          </Button>
        )}
      </span>
    );
  }

  if (count === null) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)}>
        {t('import.estimate.unknown')}
      </span>
    );
  }

  // Format count with locale string for display
  const formattedCount = count.toLocaleString();

  return (
    <span className={cn('text-sm text-muted-foreground', className)}>
      ({formattedCount} {t('import.estimate.messagesLabel')})
    </span>
  );
}
