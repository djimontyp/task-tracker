/**
 * CardHeaderWithActions - Card header with title and action buttons
 *
 * Provides three layout strategies for handling action buttons:
 * - stacked: Title full-width, actions below (best for many actions)
 * - inline: Title left, actions right (best for 1-2 actions)
 * - dropdown: Title full-width, actions in overflow menu (compact)
 *
 * @example
 * // Stacked layout (many actions)
 * <CardHeaderWithActions
 *   title="Knowledge Extraction"
 *   description="AI-powered insights"
 *   layout="stacked"
 *   actions={[
 *     <Button key="edit">Edit</Button>,
 *     <Button key="delete" variant="destructive">Delete</Button>
 *   ]}
 * />
 *
 * // Dropdown layout (compact)
 * <CardHeaderWithActions
 *   title="Agent Configuration"
 *   layout="dropdown"
 *   actions={[
 *     { label: 'Edit', icon: Pencil, onClick: handleEdit },
 *     { label: 'Copy', icon: Copy, onClick: handleCopy },
 *     { label: 'Delete', icon: Trash2, onClick: handleDelete, variant: 'destructive' },
 *   ]}
 * />
 */

import * as React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { TruncatedText } from '@/shared/ui/truncated-text';
import { cn } from '@/shared/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ===================================================================
// TYPES
// ===================================================================

export type CardHeaderLayout = 'stacked' | 'inline' | 'dropdown';

export interface DropdownAction {
  /** Action label */
  label: string;
  /** Icon component */
  icon?: LucideIcon;
  /** Click handler */
  onClick: () => void;
  /** Visual variant */
  variant?: 'default' | 'destructive';
  /** Disable the action */
  disabled?: boolean;
  /** Add separator before this item */
  separatorBefore?: boolean;
}

export interface CardHeaderWithActionsProps {
  /** Card title */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Layout strategy */
  layout?: CardHeaderLayout;
  /** Action buttons (for stacked/inline layouts) */
  actions?: React.ReactNode;
  /** Action items (for dropdown layout) */
  dropdownActions?: DropdownAction[];
  /** Whether title should truncate with tooltip */
  truncateTitle?: boolean;
  /** Icon to show before title */
  icon?: React.ReactNode;
  /** Badge to show after title */
  badge?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Override dropdown trigger aria-label */
  dropdownLabel?: string;
  /** Max actions to show inline before switching to dropdown */
  inlineMaxActions?: number;
}

// ===================================================================
// SUB-COMPONENTS
// ===================================================================

interface ActionsContainerProps {
  children: React.ReactNode;
  layout: CardHeaderLayout;
  className?: string;
}

function ActionsContainer({ children, layout, className }: ActionsContainerProps) {
  if (layout === 'stacked') {
    return (
      <div className={cn('flex flex-wrap gap-2 mt-4', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 shrink-0', className)}>
      {children}
    </div>
  );
}

interface DropdownActionsProps {
  actions: DropdownAction[];
  label?: string;
}

function DropdownActions({ actions, label = 'More actions' }: DropdownActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          aria-label={label}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, index) => (
          <React.Fragment key={action.label}>
            {action.separatorBefore && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                action.variant === 'destructive' && 'text-destructive focus:text-destructive'
              )}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ===================================================================
// MAIN COMPONENT
// ===================================================================

export const CardHeaderWithActions = React.forwardRef<
  HTMLDivElement,
  CardHeaderWithActionsProps
>(
  (
    {
      title,
      description,
      layout = 'inline',
      actions,
      dropdownActions,
      truncateTitle = true,
      icon,
      badge,
      className,
      dropdownLabel,
      inlineMaxActions = 2,
    },
    ref
  ) => {
    // Determine effective layout based on action count
    const effectiveLayout = React.useMemo(() => {
      if (layout === 'dropdown') return 'dropdown';
      if (layout === 'stacked') return 'stacked';

      // For inline layout, check if we should auto-switch to dropdown
      const actionCount = React.Children.count(actions);
      if (actionCount > inlineMaxActions) {
        return 'stacked';
      }
      return 'inline';
    }, [layout, actions, inlineMaxActions]);

    const hasActions = actions || (dropdownActions && dropdownActions.length > 0);

    // Render title with optional truncation
    const titleContent = truncateTitle ? (
      <TruncatedText
        text={title}
        className="text-lg font-semibold leading-none tracking-tight"
        as="span"
      />
    ) : (
      <span className="text-lg font-semibold leading-none tracking-tight">
        {title}
      </span>
    );

    return (
      <CardHeader
        ref={ref}
        className={cn(
          effectiveLayout === 'inline' && 'flex-row items-start justify-between gap-4',
          className
        )}
      >
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title row with icon and badge */}
          <CardTitle className="flex items-center gap-2">
            {icon && (
              <span className="shrink-0">{icon}</span>
            )}
            <span className="min-w-0 flex-1">{titleContent}</span>
            {badge && (
              <span className="shrink-0">{badge}</span>
            )}
          </CardTitle>

          {/* Description */}
          {description && (
            <CardDescription>{description}</CardDescription>
          )}

          {/* Stacked actions (below title) */}
          {effectiveLayout === 'stacked' && hasActions && (
            <ActionsContainer layout="stacked">
              {actions}
              {dropdownActions && dropdownActions.length > 0 && (
                <DropdownActions actions={dropdownActions} label={dropdownLabel} />
              )}
            </ActionsContainer>
          )}
        </div>

        {/* Inline/Dropdown actions (right side) */}
        {effectiveLayout !== 'stacked' && hasActions && (
          <ActionsContainer layout={effectiveLayout}>
            {effectiveLayout === 'inline' && actions}
            {(effectiveLayout === 'dropdown' || dropdownActions) && dropdownActions && (
              <DropdownActions actions={dropdownActions} label={dropdownLabel} />
            )}
          </ActionsContainer>
        )}
      </CardHeader>
    );
  }
);

CardHeaderWithActions.displayName = 'CardHeaderWithActions';

// ===================================================================
// HELPER: Compact Card Header (minimal version)
// ===================================================================

export interface CompactCardHeaderProps {
  /** Card title */
  title: string;
  /** Single action button or dropdown */
  action?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
}

export const CompactCardHeader = React.forwardRef<
  HTMLDivElement,
  CompactCardHeaderProps
>(({ title, action, className }, ref) => {
  return (
    <CardHeader
      ref={ref}
      className={cn('flex-row items-center justify-between gap-4 py-4', className)}
    >
      <TruncatedText
        text={title}
        className="text-base font-semibold"
        as="h3"
      />
      {action && <div className="shrink-0">{action}</div>}
    </CardHeader>
  );
});

CompactCardHeader.displayName = 'CompactCardHeader';
