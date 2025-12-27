/**
 * Z-Index Design Tokens
 *
 * Centralized z-index values for consistent layering across the application.
 * These values are also exposed in Tailwind config for class-based usage.
 *
 * @example
 * // TypeScript usage (dynamic styles)
 * import { zIndex } from '@/shared/tokens';
 * style={{ zIndex: zIndex.modal }}
 *
 * // Tailwind usage (recommended)
 * <div className="z-dropdown">   // z-index: 10
 * <div className="z-modal">      // z-index: 50
 * <div className="z-tooltip">    // z-index: 70
 *
 * @see docs/design-system/README.md
 */

/**
 * Z-index scale following a consistent layering system.
 *
 * Layer hierarchy (bottom to top):
 * 1. base (0) - Default content
 * 2. dropdown (10) - Dropdowns, selects, autocomplete
 * 3. sticky (20) - Sticky headers, floating buttons
 * 4. fixed (30) - Fixed navigation, sidebars
 * 5. modalBackdrop (40) - Modal/dialog backdrops
 * 6. modal (50) - Modals, dialogs, sheets, alerts
 * 7. popover (60) - Popovers, context menus
 * 8. tooltip (70) - Tooltips (always on top of interactive elements)
 * 9. toast (80) - Toast notifications (highest priority feedback)
 * 10. max (9999) - Emergency override (use sparingly!)
 */
export const zIndex = {
  /** Default content layer */
  base: 0,

  /** Dropdowns, selects, autocomplete lists */
  dropdown: 10,

  /** Sticky headers, floating action buttons */
  sticky: 20,

  /** Fixed navigation, sidebars */
  fixed: 30,

  /** Modal/dialog backdrop overlay */
  modalBackdrop: 40,

  /** Modals, dialogs, sheets, alert dialogs */
  modal: 50,

  /** Popovers, context menus, dropdown menus */
  popover: 60,

  /** Tooltips - always visible above interactive elements */
  tooltip: 70,

  /** Toast notifications - highest priority user feedback */
  toast: 80,

  /** Emergency override - use only when absolutely necessary */
  max: 9999,
} as const;

/**
 * Type for z-index token keys
 */
export type ZIndexToken = keyof typeof zIndex;

/**
 * Type for z-index values
 */
export type ZIndexValue = (typeof zIndex)[ZIndexToken];

/**
 * Tailwind class mappings for z-index tokens.
 * Use these when you need conditional z-index in className.
 *
 * @example
 * import { zIndexClasses } from '@/shared/tokens';
 * <div className={cn(zIndexClasses.modal, isOpen && 'visible')}>
 */
export const zIndexClasses = {
  base: 'z-base',
  dropdown: 'z-dropdown',
  sticky: 'z-sticky',
  fixed: 'z-fixed',
  modalBackdrop: 'z-modal-backdrop',
  modal: 'z-modal',
  popover: 'z-popover',
  tooltip: 'z-tooltip',
  toast: 'z-toast',
  max: 'z-max',
} as const;

/**
 * Helper to get z-index value by token name
 */
export function getZIndex(token: ZIndexToken): number {
  return zIndex[token];
}
