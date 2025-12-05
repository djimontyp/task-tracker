/**
 * Design System Spacing Tokens
 *
 * Type-safe utilities for spacing (4px grid system).
 * All values are multiples of 4px.
 *
 * @example
 * import { spacing, gap, padding } from '@/shared/tokens/spacing';
 * <div className={spacing.stack.md}>         // space-y-4
 * <div className={gap.md}>                   // gap-4
 * <Card className={padding.card.default}>    // p-6
 *
 * @see docs/design-system/02-spacing.md
 */

// ═══════════════════════════════════════════════════════════════
// GAP UTILITIES (Flexbox/Grid spacing)
// ═══════════════════════════════════════════════════════════════

export const gap = {
  /** 0px - no gap */
  none: 'gap-0',
  /** 4px - minimal gap */
  xs: 'gap-1',
  /** 8px - tight spacing */
  sm: 'gap-2',
  /** 16px - default gap */
  md: 'gap-4',
  /** 24px - comfortable spacing */
  lg: 'gap-6',
  /** 32px - generous spacing */
  xl: 'gap-8',
  /** 40px - large section gaps */
  '2xl': 'gap-10',
  /** 48px - extra large gaps */
  '3xl': 'gap-12',
} as const;

// ═══════════════════════════════════════════════════════════════
// PADDING UTILITIES (Component internal spacing)
// ═══════════════════════════════════════════════════════════════

export const padding = {
  /** Card padding (default: 24px, mobile: 16px) */
  card: {
    default: 'p-6',
    sm: 'p-4',
    lg: 'p-8',
  },
  /** Button padding */
  button: {
    sm: 'px-2 py-1',
    md: 'px-4 py-2',
    lg: 'px-6 py-4',
  },
  /** Input/Form padding */
  input: {
    default: 'px-4 py-2',
    sm: 'px-2 py-1',
  },
  /** Section padding (responsive) */
  section: {
    mobile: 'p-4',
    tablet: 'md:p-6',
    desktop: 'lg:p-8',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// MARGIN UTILITIES (Component external spacing)
// ═══════════════════════════════════════════════════════════════

export const margin = {
  /** 0px */
  none: 'm-0',
  /** 8px */
  sm: 'm-2',
  /** 16px */
  md: 'm-4',
  /** 24px */
  lg: 'm-6',
  /** 32px */
  xl: 'm-8',
} as const;

// ═══════════════════════════════════════════════════════════════
// STACK SPACING (Vertical rhythm)
// ═══════════════════════════════════════════════════════════════

export const spacing = {
  /** Vertical stack spacing */
  stack: {
    /** 4px - tight vertical spacing */
    xs: 'space-y-1',
    /** 8px - compact vertical spacing */
    sm: 'space-y-2',
    /** 16px - default vertical spacing */
    md: 'space-y-4',
    /** 24px - comfortable vertical spacing */
    lg: 'space-y-6',
    /** 32px - generous vertical spacing */
    xl: 'space-y-8',
  },
  /** Horizontal inline spacing */
  inline: {
    /** 4px */
    xs: 'space-x-1',
    /** 8px */
    sm: 'space-x-2',
    /** 16px */
    md: 'space-x-4',
    /** 24px */
    lg: 'space-x-6',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// TOUCH TARGET SIZES (WCAG 2.5.5 compliant)
// ═══════════════════════════════════════════════════════════════

export const touchTarget = {
  /** 44px - minimum WCAG AA compliant size */
  min: 'h-11 w-11',
  /** 48px - comfortable touch target */
  comfortable: 'h-12 w-12',
  /** 56px - large touch target */
  large: 'h-14 w-14',
} as const;

// ═══════════════════════════════════════════════════════════════
// BORDER RADIUS (Consistent rounding)
// ═══════════════════════════════════════════════════════════════

export const radius = {
  /** No rounding */
  none: 'rounded-none',
  /** 2px - subtle rounding */
  sm: 'rounded-sm',
  /** 4px - default rounding */
  md: 'rounded-md',
  /** 8px - card rounding */
  lg: 'rounded-lg',
  /** 12px - large rounding */
  xl: 'rounded-xl',
  /** 16px - extra large rounding */
  '2xl': 'rounded-2xl',
  /** Full circle */
  full: 'rounded-full',
} as const;

// ═══════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════

export type GapSize = keyof typeof gap;
export type PaddingPreset = keyof typeof padding;
export type SpacingDirection = keyof typeof spacing;
