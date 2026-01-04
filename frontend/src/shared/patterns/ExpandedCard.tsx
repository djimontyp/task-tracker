/**
 * ExpandedCard - Desktop-first card variant with full content layout
 *
 * Designed for larger screens (>=640px) with:
 * - Full header with title and optional actions
 * - Structured metadata via DataList component
 * - Description section for text content
 * - Footer slot for additional content
 * - Touch targets >= 44px (WCAG compliant)
 *
 * @example
 * // Basic usage
 * <ExpandedCard
 *   header={<h3>Agent Name</h3>}
 *   description="This agent processes incoming messages..."
 *   metadata={[
 *     { label: 'Model', value: 'gpt-4o' },
 *     { label: 'Status', value: <Badge>Active</Badge> },
 *   ]}
 * />
 *
 * // With actions
 * <ExpandedCard
 *   header={<h3>Topic Name</h3>}
 *   actions={
 *     <CardActions
 *       primary={<Button>Edit</Button>}
 *       dropdownItems={[
 *         { label: 'Delete', onClick: handleDelete, variant: 'destructive' },
 *       ]}
 *     />
 *   }
 * />
 *
 * // Navigation card (clickable)
 * <ExpandedCard
 *   header={<h3>Project Name</h3>}
 *   onClick={() => navigate('/projects/123')}
 * />
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/lib/utils';
import { AlertCircle, RefreshCw, Inbox } from 'lucide-react';
import { DataList, type DataListItem } from './DataList';

// ===================================================================
// TYPES
// ===================================================================

export interface ExpandedCardProps {
  /** Header content (title, icon, etc.) - required */
  header: React.ReactNode;
  /** Metadata items displayed via DataList */
  metadata?: DataListItem[];
  /** Description text content */
  description?: string;
  /** Action buttons slot */
  actions?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Make card clickable */
  onClick?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  isError?: boolean;
  /** Error object for message display */
  error?: Error;
  /** Retry handler for error state */
  onRetry?: () => void;
  /** Empty state (no content) */
  isEmpty?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS class */
  className?: string;
  /** ARIA label for card */
  'aria-label'?: string;
  /** Number of metadata columns (1-3) */
  metadataColumns?: 1 | 2 | 3;
  /** Metadata density */
  metadataDensity?: 'compact' | 'comfortable' | 'spacious';
}

// ===================================================================
// LOADING STATE
// ===================================================================

interface ExpandedCardLoadingProps {
  className?: string;
}

function ExpandedCardLoading({ className }: ExpandedCardLoadingProps) {
  return (
    <Card className={cn('hidden sm:block', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 p-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 w-11 rounded-md" />
          <Skeleton className="h-11 w-11 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Skeleton className="h-16 w-full" />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===================================================================
// ERROR STATE
// ===================================================================

interface ExpandedCardErrorProps {
  error?: Error;
  onRetry?: () => void;
  className?: string;
}

function ExpandedCardError({
  error,
  onRetry,
  className,
}: ExpandedCardErrorProps) {
  const { t } = useTranslation('common');
  return (
    <Card className={cn('hidden sm:block', className)}>
      <CardContent className="p-4">
        <div
          className="flex items-center gap-4"
          role="alert"
          aria-live="polite"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle
              className="h-6 w-6 text-destructive"
              aria-hidden="true"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-base">{t('cardStates.error.title')}</p>
            {error && (
              <p className="mt-1 text-sm text-muted-foreground truncate">
                {error.message}
              </p>
            )}
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="default"
              className="h-11 px-4 flex-shrink-0"
              onClick={onRetry}
              aria-label={t('cardStates.error.retryAriaLabel')}
            >
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              {t('cardStates.error.retry')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ===================================================================
// EMPTY STATE
// ===================================================================

interface ExpandedCardEmptyProps {
  message?: string;
  className?: string;
}

function ExpandedCardEmpty({
  message,
  className,
}: ExpandedCardEmptyProps) {
  const { t } = useTranslation('common');
  const displayMessage = message || t('cardStates.empty.default');
  return (
    <Card className={cn('hidden sm:block', className)}>
      <CardContent className="p-4">
        <div
          className="flex flex-col items-center justify-center py-8 text-center"
          role="status"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{displayMessage}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ===================================================================
// MAIN COMPONENT
// ===================================================================

export const ExpandedCard = React.forwardRef<HTMLDivElement, ExpandedCardProps>(
  (
    {
      header,
      metadata,
      description,
      actions,
      footer,
      onClick,
      isLoading = false,
      isError = false,
      error,
      onRetry,
      isEmpty = false,
      emptyMessage,
      className,
      'aria-label': ariaLabel,
      metadataColumns = 2,
      metadataDensity = 'compact',
    },
    ref
  ) => {
    // Loading state
    if (isLoading) {
      return <ExpandedCardLoading className={className} />;
    }

    // Error state
    if (isError) {
      return (
        <ExpandedCardError
          error={error}
          onRetry={onRetry}
          className={className}
        />
      );
    }

    // Empty state
    if (isEmpty) {
      return <ExpandedCardEmpty message={emptyMessage} className={className} />;
    }

    // Interactive card styling
    const isClickable = !!onClick;
    const cardClasses = cn(
      'hidden sm:block', // Desktop only - hidden on mobile
      isClickable &&
        'cursor-pointer transition-colors hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick?.();
      }
    };

    const hasMetadata = metadata && metadata.length > 0;
    const hasDescription = !!description;
    const hasFooter = !!footer;
    const hasContent = hasMetadata || hasDescription;

    return (
      <Card
        ref={ref}
        className={cardClasses}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={ariaLabel}
        onKeyDown={isClickable ? handleKeyDown : undefined}
      >
        {/* Header: Title + Actions */}
        <CardHeader className="flex flex-row items-start justify-between gap-4 p-4">
          <div className="flex-1 min-w-0">{header}</div>
          {actions && (
            <div
              className="flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          )}
        </CardHeader>

        {/* Content: Description + Metadata */}
        {hasContent && (
          <CardContent className="p-4 pt-0">
            {/* Description */}
            {hasDescription && (
              <p
                className={cn(
                  'text-sm text-muted-foreground leading-relaxed',
                  hasMetadata && 'mb-4'
                )}
              >
                {description}
              </p>
            )}

            {/* Metadata via DataList */}
            {hasMetadata && (
              <DataList
                items={metadata}
                columns={metadataColumns}
                density={metadataDensity}
                orientation="vertical"
                className="pt-2"
              />
            )}
          </CardContent>
        )}

        {/* Footer */}
        {hasFooter && (
          <CardFooter className="p-4 pt-0 border-t border-border mt-2">
            <div className="w-full pt-4">{footer}</div>
          </CardFooter>
        )}
      </Card>
    );
  }
);

ExpandedCard.displayName = 'ExpandedCard';

// ===================================================================
// EXPORTS
// ===================================================================

export { ExpandedCardLoading, ExpandedCardError, ExpandedCardEmpty };
