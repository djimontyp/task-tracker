/**
 * BulkActionBar - Sticky bottom bar for bulk review actions
 *
 * Appears when messages are selected, provides:
 * - Selection count
 * - Clear selection
 * - Reject selected
 * - Approve selected
 *
 * Design: Fixed bottom, slides up on selection.
 * Touch-friendly with 44px minimum targets.
 */

import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { zIndexClasses } from '@/shared/tokens';
import { Check, X, XCircle, Loader2 } from 'lucide-react';

export interface BulkActionBarProps {
  /** Number of selected items */
  selectedCount: number;
  /** Total available items */
  totalCount?: number;
  /** Handler for clearing selection */
  onClearSelection: () => void;
  /** Handler for approving selected items */
  onApproveSelected: () => void;
  /** Handler for rejecting selected items */
  onRejectSelected: () => void;
  /** Loading state for approve action */
  isApproving?: boolean;
  /** Loading state for reject action */
  isRejecting?: boolean;
  /** Additional className */
  className?: string;
}

export const BulkActionBar = React.forwardRef<HTMLDivElement, BulkActionBarProps>(
  (
    {
      selectedCount,
      totalCount,
      onClearSelection,
      onApproveSelected,
      onRejectSelected,
      isApproving = false,
      isRejecting = false,
      className,
    },
    ref
  ) => {
    const isLoading = isApproving || isRejecting;
    const isVisible = selectedCount > 0;

    // Don't render at all when nothing selected
    if (!isVisible) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          // Positioning
          'fixed bottom-0 left-0 right-0',
          zIndexClasses.sticky,
          // Animation
          'animate-in slide-in-from-bottom duration-300',
          className
        )}
        role="toolbar"
        aria-label="Bulk actions"
      >
        {/* Gradient fade at top - pointer-events-none to allow clicking through */}
        <div
          className="h-4 bg-gradient-to-t from-background to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Main bar */}
        <div
          className={cn(
            'bg-background', // Solid background, no transparency
            'border-t shadow-lg',
            'px-4 py-4 sm:px-6'
          )}
        >
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
            {/* Selection info */}
            <div className="flex items-center gap-4">
              <Badge
                variant="secondary"
                className="h-8 px-3 text-sm font-semibold tabular-nums"
              >
                {selectedCount} selected
                {totalCount && (
                  <span className="text-muted-foreground font-normal ml-1">
                    / {totalCount}
                  </span>
                )}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                disabled={isLoading}
                className="h-10 text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Reject button */}
              <Button
                variant="outline"
                size="lg"
                onClick={onRejectSelected}
                disabled={isLoading}
                className={cn(
                  'h-11 min-w-[120px]',
                  'border-destructive/50 text-destructive',
                  'hover:bg-destructive hover:text-destructive-foreground',
                  'transition-colors'
                )}
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Reject
              </Button>

              {/* Approve button */}
              <Button
                variant="default"
                size="lg"
                onClick={onApproveSelected}
                disabled={isLoading}
                className={cn(
                  'h-11 min-w-[120px]',
                  'bg-semantic-success hover:bg-semantic-success/90',
                  'text-white',
                  'shadow-md hover:shadow-lg',
                  'transition-all'
                )}
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Approve
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

BulkActionBar.displayName = 'BulkActionBar';

/**
 * Height of the BulkActionBar including gradient fade.
 * Use this to add padding-bottom to your content container.
 *
 * @example
 * <div className="pb-[var(--bulk-action-bar-height)]">
 *   {content}
 * </div>
 * <BulkActionBar ... />
 */
export const BULK_ACTION_BAR_HEIGHT = 100; // px (gradient 16px + padding 32px + button 44px + border)

/**
 * Spacer component to prevent content from being hidden behind the bar.
 * Add this at the end of your scrollable content when BulkActionBar is visible.
 */
export const BulkActionBarSpacer = ({ visible = true }: { visible?: boolean }) => (
  <div
    className={cn(
      'transition-all duration-300',
      visible ? 'h-28' : 'h-0' // 112px when visible
    )}
    aria-hidden="true"
  />
);

/**
 * Hook for managing bulk selection state
 */
export function useBulkSelection<T extends { id: string }>() {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const select = React.useCallback((id: string) => {
    setSelectedIds((prev) => new Set([...prev, id]));
  }, []);

  const deselect = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggle = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = React.useCallback((items: T[]) => {
    setSelectedIds(new Set(items.map((item) => item.id)));
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = React.useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    select,
    deselect,
    toggle,
    selectAll,
    clearSelection,
    isSelected,
  };
}
