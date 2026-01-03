/**
 * CompactCard - Mobile-first card variant with condensed layout
 *
 * Designed for small screens (<=640px) with:
 * - Single-line truncated title with tooltip
 * - Compact padding (p-3 vs default p-4)
 * - Primary action always visible
 * - Overflow menu for 3+ secondary actions
 * - Touch targets >= 44px (WCAG compliant)
 *
 * @example
 * // Basic usage
 * <CompactCard
 *   title="Long title that will be truncated"
 *   badge={<Badge variant="outline">Active</Badge>}
 *   content={<p className="line-clamp-2">Description...</p>}
 * />
 *
 * // With actions
 * <CompactCard
 *   title="Agent Name"
 *   primaryAction={{ label: 'Edit', icon: <Pencil />, onClick: handleEdit }}
 *   secondaryActions={[
 *     { label: 'Copy', icon: <Copy />, onClick: handleCopy },
 *     { label: 'Delete', icon: <Trash2 />, onClick: handleDelete },
 *   ]}
 * />
 *
 * // Navigation card (clickable)
 * <CompactCard
 *   title="Topic Name"
 *   onClick={() => navigate('/topics/123')}
 * />
 */

import * as React from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { TruncatedText } from '@/shared/ui/truncated-text';
import { cn } from '@/shared/lib/utils';
import { MoreHorizontal, AlertCircle, RefreshCw, Inbox } from 'lucide-react';

// ===================================================================
// TYPES
// ===================================================================

export interface CompactCardAction {
  /** Action label (used for tooltip and dropdown) */
  label: string;
  /** Icon component */
  icon: React.ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Visual variant */
  variant?: 'default' | 'destructive';
  /** Disable the action */
  disabled?: boolean;
}

export interface CompactCardProps {
  /** Card title (single line, truncated with tooltip) */
  title: string;
  /** Badge displayed next to title */
  badge?: React.ReactNode;
  /** Primary action (always visible) */
  primaryAction?: CompactCardAction;
  /** Secondary actions (shown in overflow menu when 3+) */
  secondaryActions?: CompactCardAction[];
  /** Card content (below title) */
  content?: React.ReactNode;
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
}

// ===================================================================
// CONSTANTS
// ===================================================================

/** Number of secondary actions before collapsing to dropdown */
const OVERFLOW_THRESHOLD = 2;

// ===================================================================
// SUB-COMPONENTS
// ===================================================================

interface ActionButtonProps {
  action: CompactCardAction;
  className?: string;
}

/**
 * Single action button with tooltip
 * Touch target >= 44px (h-11 w-11)
 */
function ActionButton({ action, className }: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={action.variant === 'destructive' ? 'ghost' : 'ghost'}
          size="icon"
          className={cn(
            'h-11 w-11 flex-shrink-0',
            action.variant === 'destructive' &&
              'text-destructive hover:text-destructive hover:bg-destructive/10',
            className
          )}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          disabled={action.disabled}
          aria-label={action.label}
        >
          {action.icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{action.label}</TooltipContent>
    </Tooltip>
  );
}

interface OverflowMenuProps {
  actions: CompactCardAction[];
  label?: string;
}

/**
 * Overflow dropdown menu for secondary actions
 */
function OverflowMenu({ actions, label = 'More actions' }: OverflowMenuProps) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 flex-shrink-0"
              aria-label={label}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {actions.map((action, index) => (
          <React.Fragment key={action.label}>
            {index > 0 && action.variant === 'destructive' && (
              <DropdownMenuSeparator />
            )}
            <DropdownMenuItem
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                action.variant === 'destructive' &&
                  'text-destructive focus:text-destructive focus:bg-destructive/10'
              )}
            >
              <span className="mr-2">{action.icon}</span>
              {action.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ===================================================================
// LOADING STATE
// ===================================================================

function CompactCardLoading() {
  return (
    <Card className="sm:hidden">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-11 w-11 rounded-md" />
        </div>
        <Skeleton className="mt-2 h-10 w-full" />
      </CardContent>
    </Card>
  );
}

// ===================================================================
// ERROR STATE
// ===================================================================

interface CompactCardErrorProps {
  error?: Error;
  onRetry?: () => void;
}

function CompactCardError({ error, onRetry }: CompactCardErrorProps) {
  return (
    <Card className="sm:hidden">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <span className="text-sm font-medium truncate">Failed to load</span>
          {onRetry && (
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 ml-auto flex-shrink-0"
              onClick={onRetry}
              aria-label="Retry"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        {error && (
          <p className="mt-2 text-xs text-muted-foreground truncate">
            {error.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ===================================================================
// EMPTY STATE
// ===================================================================

interface CompactCardEmptyProps {
  message?: string;
}

function CompactCardEmpty({ message = 'No content' }: CompactCardEmptyProps) {
  return (
    <Card className="sm:hidden">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Inbox className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm truncate">{message}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ===================================================================
// MAIN COMPONENT
// ===================================================================

export const CompactCard = React.forwardRef<HTMLDivElement, CompactCardProps>(
  (
    {
      title,
      badge,
      primaryAction,
      secondaryActions = [],
      content,
      onClick,
      isLoading = false,
      isError = false,
      error,
      onRetry,
      isEmpty = false,
      emptyMessage,
      className,
      'aria-label': ariaLabel,
    },
    ref
  ) => {
    // Loading state
    if (isLoading) {
      return <CompactCardLoading />;
    }

    // Error state
    if (isError) {
      return <CompactCardError error={error} onRetry={onRetry} />;
    }

    // Empty state
    if (isEmpty) {
      return <CompactCardEmpty message={emptyMessage} />;
    }

    // Determine which actions to show inline vs overflow
    const hasOverflow = secondaryActions.length > OVERFLOW_THRESHOLD;
    const inlineSecondaryActions = hasOverflow ? [] : secondaryActions;
    const overflowActions = hasOverflow ? secondaryActions : [];

    // Interactive card styling
    const isClickable = !!onClick;
    const cardClasses = cn(
      'sm:hidden', // Mobile only - hidden on sm and above
      isClickable && 'cursor-pointer hover:bg-accent/10 transition-colors',
      className
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick?.();
      }
    };

    return (
      <Card
        ref={ref}
        className={cardClasses}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={ariaLabel || (isClickable ? title : undefined)}
        onKeyDown={isClickable ? handleKeyDown : undefined}
      >
        <CardContent className="p-3">
          {/* Header: Title + Badge + Actions */}
          <div className="flex items-center gap-2">
            {/* Title with truncation and tooltip */}
            <TruncatedText
              text={title}
              lines={1}
              className="flex-1 min-w-0 font-semibold text-base"
              as="h3"
            />

            {/* Badge */}
            {badge && <div className="flex-shrink-0">{badge}</div>}

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Primary action - always visible */}
              {primaryAction && <ActionButton action={primaryAction} />}

              {/* Inline secondary actions (when <= threshold) */}
              {inlineSecondaryActions.map((action) => (
                <ActionButton key={action.label} action={action} />
              ))}

              {/* Overflow menu (when > threshold) */}
              {hasOverflow && <OverflowMenu actions={overflowActions} />}
            </div>
          </div>

          {/* Content (optional) */}
          {content && <div className="mt-2">{content}</div>}
        </CardContent>
      </Card>
    );
  }
);

CompactCard.displayName = 'CompactCard';

// ===================================================================
// EXPORTS
// ===================================================================

export { CompactCardLoading, CompactCardError, CompactCardEmpty };
