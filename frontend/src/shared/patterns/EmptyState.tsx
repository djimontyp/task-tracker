/**
 * EmptyState - Placeholder for empty lists/views
 *
 * A consistent pattern for displaying empty states with icon, title,
 * description, and optional action button.
 *
 * @example
 * <EmptyState
 *   icon={InboxIcon}
 *   title="No messages yet"
 *   description="Messages will appear here once you receive them"
 *   action={<Button>Add first message</Button>}
 * />
 */

import type { ReactNode, ComponentType } from 'react';
import { cn } from '@/shared/lib/utils';
import { emptyState as emptyStateTokens, cards } from '@/shared/tokens';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type EmptyStateVariant = 'default' | 'card' | 'compact' | 'inline';

export interface EmptyStateProps {
  /** Icon component (from lucide-react) */
  icon?: ComponentType<{ className?: string }>;
  /** Main title text */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Optional action button/element */
  action?: ReactNode;
  /** Visual variant */
  variant?: EmptyStateVariant;
  /** Additional className */
  className?: string;
  /** Icon size (Tailwind class) */
  iconSize?: 'sm' | 'md' | 'lg';
}

// ═══════════════════════════════════════════════════════════════
// ICON SIZE CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const iconSizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
} as const;

const iconContainerClasses = {
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
} as const;

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
  variant = 'default',
  className,
  iconSize = 'md',
}: EmptyStateProps) {
  const isCard = variant === 'card';
  const isCompact = variant === 'compact';
  const isInline = variant === 'inline';

  // Inline variant - horizontal layout
  if (isInline) {
    return (
      <div
        className={cn(
          'flex items-center gap-4 py-4',
          className
        )}
      >
        {IconComponent && (
          <div className="shrink-0 rounded-full bg-muted p-2">
            <IconComponent className={cn('text-muted-foreground', iconSizeClasses.sm)} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }

  // Compact variant - smaller padding
  if (isCompact) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center',
          'py-6 text-center',
          className
        )}
      >
        {IconComponent && (
          <div className={cn('rounded-full bg-muted mb-2', iconContainerClasses.sm)}>
            <IconComponent className={cn('text-muted-foreground', iconSizeClasses.sm)} />
          </div>
        )}
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
            {description}
          </p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }

  // Default and card variants
  return (
    <div
      className={cn(
        emptyStateTokens.container,
        isCard && cards.empty,
        className
      )}
    >
      {IconComponent && (
        <div className={cn(emptyStateTokens.icon, iconContainerClasses[iconSize])}>
          <IconComponent className={cn('text-muted-foreground', iconSizeClasses[iconSize])} />
        </div>
      )}
      <h3 className={emptyStateTokens.title}>{title}</h3>
      {description && (
        <p className={emptyStateTokens.description}>{description}</p>
      )}
      {action && <div className={emptyStateTokens.action}>{action}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Empty State with illustration
// ═══════════════════════════════════════════════════════════════

export interface IllustratedEmptyStateProps extends Omit<EmptyStateProps, 'icon'> {
  /** Custom illustration element (SVG, image) */
  illustration: ReactNode;
}

export function IllustratedEmptyState({
  illustration,
  title,
  description,
  action,
  className,
}: IllustratedEmptyStateProps) {
  return (
    <div className={cn(emptyStateTokens.container, className)}>
      <div className="mb-4">{illustration}</div>
      <h3 className={emptyStateTokens.title}>{title}</h3>
      {description && (
        <p className={emptyStateTokens.description}>{description}</p>
      )}
      {action && <div className={emptyStateTokens.action}>{action}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Loading Empty State (skeleton version)
// ═══════════════════════════════════════════════════════════════

export interface LoadingEmptyStateProps {
  /** Additional className */
  className?: string;
}

export function LoadingEmptyState({ className }: LoadingEmptyStateProps) {
  return (
    <div className={cn(emptyStateTokens.container, className)}>
      <div className="rounded-full bg-muted h-16 w-16 animate-pulse mb-4" />
      <div className="h-5 w-32 bg-muted animate-pulse rounded" />
      <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
    </div>
  );
}
