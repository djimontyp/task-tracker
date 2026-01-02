/**
 * SettingsSection - Section container with header for settings page
 *
 * Displays a section header with title and optional description,
 * followed by children cards in a vertical stack.
 *
 * @example
 * <SettingsSection title="General" description="App preferences">
 *   <SettingsCard ... />
 *   <SettingsCard ... />
 * </SettingsSection>
 */

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export interface SettingsSectionProps {
  /** Section title */
  title: string;
  /** Optional description */
  description?: string;
  /** Children (SettingsCard components) */
  children: ReactNode;
  /** Additional className for container */
  className?: string;
}

export function SettingsSection({
  title,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section className={cn('flex flex-col', className)} aria-labelledby={`section-${title.toLowerCase()}`}>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <h2
          id={`section-${title.toLowerCase()}`}
          className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0"
        >
          {title}
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Optional description */}
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}

      {/* Cards stack */}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════

export interface SettingsEmptyStateProps {
  /** Icon component */
  icon: React.ComponentType<{ className?: string }>;
  /** Title text */
  title: string;
  /** Description text */
  description: string;
  /** Action button */
  action?: ReactNode;
  /** Additional className */
  className?: string;
}

export function SettingsEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: SettingsEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8 px-4 text-center',
        'border border-dashed rounded-lg',
        className
      )}
    >
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
        {description}
      </p>
      {action}
    </div>
  );
}
