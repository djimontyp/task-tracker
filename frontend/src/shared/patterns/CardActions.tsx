/**
 * CardActions - Responsive action button container
 *
 * Handles responsive behavior for card action buttons:
 * - Primary actions are always visible
 * - Secondary actions collapse to dropdown on mobile
 *
 * @example
 * // Basic usage
 * <CardActions
 *   primary={<Button>Save</Button>}
 *   secondary={[
 *     <Button key="copy" variant="outline">Copy</Button>,
 *     <Button key="share" variant="outline">Share</Button>,
 *   ]}
 * />
 *
 * // With dropdown items
 * <CardActions
 *   primary={<Button>Edit</Button>}
 *   dropdownItems={[
 *     { label: 'Duplicate', onClick: handleDuplicate },
 *     { label: 'Delete', onClick: handleDelete, variant: 'destructive' },
 *   ]}
 * />
 */

import * as React from 'react';
import { Button } from '@/shared/ui/button';
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
import { cn } from '@/shared/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ===================================================================
// TYPES
// ===================================================================

export interface DropdownActionItem {
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

export type CardActionsLayout = 'inline' | 'stacked';

export interface CardActionsProps {
  /** Primary actions (always visible) */
  primary?: React.ReactNode;
  /** Secondary actions (collapse on mobile) */
  secondary?: React.ReactNode[];
  /** Items for dropdown menu */
  dropdownItems?: DropdownActionItem[];
  /** Layout orientation */
  layout?: CardActionsLayout;
  /** Alignment within container */
  align?: 'start' | 'end' | 'center' | 'between';
  /** Breakpoint for collapsing secondary to dropdown */
  collapseAt?: 'sm' | 'md' | 'lg';
  /** Additional CSS class */
  className?: string;
  /** Label for dropdown menu button */
  dropdownLabel?: string;
}

// ===================================================================
// ALIGNMENT CLASSES
// ===================================================================

const alignmentClasses = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
} as const;

const collapseClasses = {
  sm: {
    hidden: 'hidden sm:flex',
    visible: 'flex sm:hidden',
  },
  md: {
    hidden: 'hidden md:flex',
    visible: 'flex md:hidden',
  },
  lg: {
    hidden: 'hidden lg:flex',
    visible: 'flex lg:hidden',
  },
} as const;

// ===================================================================
// SUB-COMPONENTS
// ===================================================================

interface MoreActionsDropdownProps {
  items: DropdownActionItem[];
  label?: string;
  className?: string;
}

function MoreActionsDropdown({
  items,
  label = 'More actions',
  className,
}: MoreActionsDropdownProps) {
  if (items.length === 0) return null;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-11 w-11', className)}
              aria-label={label}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        {items.map((item, index) => (
          <React.Fragment key={item.label}>
            {item.separatorBefore && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={item.onClick}
              disabled={item.disabled}
              className={cn(
                item.variant === 'destructive' &&
                  'text-destructive focus:text-destructive focus:bg-destructive/10'
              )}
            >
              {item.icon && <item.icon className="h-4 w-4 mr-2" />}
              {item.label}
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

export const CardActions = React.forwardRef<HTMLDivElement, CardActionsProps>(
  (
    {
      primary,
      secondary,
      dropdownItems = [],
      layout = 'inline',
      align = 'end',
      collapseAt = 'md',
      className,
      dropdownLabel,
    },
    ref
  ) => {
    const hasSecondary = secondary && secondary.length > 0;
    const hasDropdown = dropdownItems.length > 0;
    const collapse = collapseClasses[collapseAt];

    if (layout === 'stacked') {
      return (
        <div
          ref={ref}
          className={cn('flex flex-col gap-2', className)}
        >
          {primary && (
            <div className="flex gap-2 flex-wrap">{primary}</div>
          )}
          {hasSecondary && (
            <div className="flex gap-2 flex-wrap">{secondary}</div>
          )}
          {hasDropdown && (
            <MoreActionsDropdown items={dropdownItems} label={dropdownLabel} />
          )}
        </div>
      );
    }

    // Inline layout
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2',
          alignmentClasses[align],
          className
        )}
      >
        {/* Primary actions - always visible */}
        {primary}

        {/* Secondary actions - visible above breakpoint */}
        {hasSecondary && (
          <div className={cn('items-center gap-2', collapse.hidden)}>
            {secondary}
          </div>
        )}

        {/* Dropdown - visible on mobile when secondary exists, or always if dropdownItems */}
        {(hasSecondary || hasDropdown) && (
          <>
            {/* Mobile dropdown for secondary actions */}
            {hasSecondary && (
              <div className={collapse.visible}>
                <MoreActionsDropdown
                  items={secondary!.map((action, index) => {
                    // Convert ReactNode to DropdownActionItem
                    // This is a simplified approach - in real usage, pass dropdownItems instead
                    if (React.isValidElement(action)) {
                      const props = action.props as {
                        onClick?: () => void;
                        children?: React.ReactNode;
                        'aria-label'?: string;
                      };
                      return {
                        label: props['aria-label'] || `Action ${index + 1}`,
                        onClick: props.onClick || (() => {}),
                      };
                    }
                    return {
                      label: `Action ${index + 1}`,
                      onClick: () => {},
                    };
                  })}
                  label={dropdownLabel}
                />
              </div>
            )}

            {/* Always-visible dropdown for explicit dropdown items */}
            {hasDropdown && (
              <MoreActionsDropdown
                items={dropdownItems}
                label={dropdownLabel}
              />
            )}
          </>
        )}
      </div>
    );
  }
);

CardActions.displayName = 'CardActions';

// ===================================================================
// HELPER: Icon Button Group
// ===================================================================

export interface IconButtonAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'ghost' | 'destructive';
  disabled?: boolean;
}

export interface IconButtonGroupProps {
  actions: IconButtonAction[];
  size?: 'default' | 'sm';
  className?: string;
}

/**
 * IconButtonGroup - Row of icon buttons with tooltips
 *
 * @example
 * <IconButtonGroup
 *   actions={[
 *     { icon: Pencil, label: 'Edit', onClick: handleEdit },
 *     { icon: Copy, label: 'Copy', onClick: handleCopy },
 *     { icon: Trash2, label: 'Delete', onClick: handleDelete, variant: 'destructive' },
 *   ]}
 * />
 */
export function IconButtonGroup({
  actions,
  size = 'default',
  className,
}: IconButtonGroupProps) {
  const buttonSize = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {actions.map((action) => (
        <Tooltip key={action.label}>
          <TooltipTrigger asChild>
            <Button
              variant={action.variant === 'destructive' ? 'ghost' : (action.variant || 'ghost')}
              size="icon"
              className={cn(
                buttonSize,
                action.variant === 'destructive' &&
                  'text-destructive hover:text-destructive hover:bg-destructive/10'
              )}
              onClick={action.onClick}
              disabled={action.disabled}
              aria-label={action.label}
            >
              <action.icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{action.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

// ===================================================================
// HELPER: Responsive Action Buttons
// ===================================================================

export interface ResponsiveActionsConfig {
  /** Actions always visible */
  visible: IconButtonAction[];
  /** Actions collapsed to dropdown on smaller screens */
  collapsed: DropdownActionItem[];
  /** Breakpoint for collapse */
  collapseAt?: 'sm' | 'md' | 'lg';
}

export interface ResponsiveActionsProps extends ResponsiveActionsConfig {
  className?: string;
  dropdownLabel?: string;
}

/**
 * ResponsiveActions - Icon buttons that collapse to dropdown
 *
 * @example
 * <ResponsiveActions
 *   visible={[
 *     { icon: Pencil, label: 'Edit', onClick: handleEdit },
 *   ]}
 *   collapsed={[
 *     { icon: Copy, label: 'Copy', onClick: handleCopy },
 *     { icon: Trash2, label: 'Delete', onClick: handleDelete, variant: 'destructive' },
 *   ]}
 *   collapseAt="sm"
 * />
 */
export function ResponsiveActions({
  visible,
  collapsed,
  collapseAt = 'md',
  className,
  dropdownLabel = 'More actions',
}: ResponsiveActionsProps) {
  const collapse = collapseClasses[collapseAt];

  // Combine collapsed actions to also show in desktop dropdown
  const allCollapsed = collapsed;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Always visible actions */}
      {visible.map((action) => (
        <Tooltip key={action.label}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-11 w-11',
                action.variant === 'destructive' &&
                  'text-destructive hover:text-destructive hover:bg-destructive/10'
              )}
              onClick={action.onClick}
              disabled={action.disabled}
              aria-label={action.label}
            >
              <action.icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{action.label}</TooltipContent>
        </Tooltip>
      ))}

      {/* Collapsed actions - visible above breakpoint as buttons */}
      <div className={cn('items-center gap-1', collapse.hidden)}>
        {collapsed.map((action) => (
          <Tooltip key={action.label}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-11 w-11',
                  action.variant === 'destructive' &&
                    'text-destructive hover:text-destructive hover:bg-destructive/10'
                )}
                onClick={action.onClick}
                disabled={action.disabled}
                aria-label={action.label}
              >
                {action.icon && <action.icon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{action.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Dropdown - visible below breakpoint */}
      {allCollapsed.length > 0 && (
        <div className={collapse.visible}>
          <MoreActionsDropdown
            items={allCollapsed}
            label={dropdownLabel}
          />
        </div>
      )}
    </div>
  );
}
