/**
 * Design System Component Patterns
 *
 * Pre-built, type-safe Tailwind class combinations for common UI patterns.
 * These patterns ensure consistency across the application.
 *
 * @example
 * import { badges, cards, buttons } from '@/shared/tokens/patterns';
 * <Badge className={badges.status.connected}>
 * <Card className={cards.default}>
 *
 * @see docs/design-system/05-components/
 */

import { cn } from '@/shared/lib/utils';

// ═══════════════════════════════════════════════════════════════
// BADGE PATTERNS
// ═══════════════════════════════════════════════════════════════

export const badges = {
  /** Status badges with icon + text (WCAG compliant) */
  status: {
    connected: cn(
      'flex items-center gap-2',
      'border-status-connected text-status-connected',
      'bg-status-connected/10'
    ),
    validating: cn(
      'flex items-center gap-2',
      'border-status-validating text-status-validating',
      'bg-status-validating/10'
    ),
    pending: cn(
      'flex items-center gap-2',
      'border-status-pending text-status-pending',
      'bg-status-pending/10'
    ),
    error: cn(
      'flex items-center gap-2',
      'border-status-error text-status-error',
      'bg-status-error/10'
    ),
  },
  /** Semantic badges (success, warning, error) */
  semantic: {
    success: cn(
      'flex items-center gap-2',
      'border-semantic-success text-semantic-success',
      'bg-semantic-success/10'
    ),
    warning: cn(
      'flex items-center gap-2',
      'border-semantic-warning text-semantic-warning',
      'bg-semantic-warning/10'
    ),
    error: cn(
      'flex items-center gap-2',
      'border-semantic-error text-semantic-error',
      'bg-semantic-error/10'
    ),
    info: cn(
      'flex items-center gap-2',
      'border-semantic-info text-semantic-info',
      'bg-semantic-info/10'
    ),
  },
  /** Atom type badges */
  atom: {
    problem: cn(
      'flex items-center gap-2',
      'border-atom-problem text-atom-problem',
      'bg-atom-problem/10'
    ),
    solution: cn(
      'flex items-center gap-2',
      'border-atom-solution text-atom-solution',
      'bg-atom-solution/10'
    ),
    decision: cn(
      'flex items-center gap-2',
      'border-atom-decision text-atom-decision',
      'bg-atom-decision/10'
    ),
    question: cn(
      'flex items-center gap-2',
      'border-atom-question text-atom-question',
      'bg-atom-question/10'
    ),
    insight: cn(
      'flex items-center gap-2',
      'border-atom-insight text-atom-insight',
      'bg-atom-insight/10'
    ),
    pattern: cn(
      'flex items-center gap-2',
      'border-atom-pattern text-atom-pattern',
      'bg-atom-pattern/10'
    ),
    requirement: cn(
      'flex items-center gap-2',
      'border-atom-requirement text-atom-requirement',
      'bg-atom-requirement/10'
    ),
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// CARD PATTERNS
// ═══════════════════════════════════════════════════════════════

export const cards = {
  /** Default card with standard padding */
  default: cn(
    'rounded-lg border bg-card text-card-foreground',
    'shadow-sm',
    'p-6'
  ),
  /** Interactive card (clickable/hoverable) */
  interactive: cn(
    'rounded-lg border bg-card text-card-foreground',
    'shadow-sm',
    'p-6',
    'transition-all duration-200',
    'hover:shadow-lg hover:scale-[1.01]',
    'cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  ),
  /** Empty state card (dashed border) */
  empty: cn(
    'rounded-lg border-2 border-dashed',
    'bg-muted/20',
    'p-8 md:p-12',
    'text-center'
  ),
  /** Alert/notification card */
  alert: {
    info: cn(
      'rounded-lg border border-semantic-info',
      'bg-semantic-info/10',
      'p-4'
    ),
    warning: cn(
      'rounded-lg border border-semantic-warning',
      'bg-semantic-warning/10',
      'p-4'
    ),
    error: cn(
      'rounded-lg border border-semantic-error',
      'bg-semantic-error/10',
      'p-4'
    ),
    success: cn(
      'rounded-lg border border-semantic-success',
      'bg-semantic-success/10',
      'p-4'
    ),
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// BUTTON PATTERNS
// ═══════════════════════════════════════════════════════════════

export const buttons = {
  /** Icon button (WCAG 2.5.5 compliant - 44px minimum) */
  icon: {
    default: 'h-11 w-11 p-0',
    large: 'h-12 w-12 p-0',
  },
  /** Button with icon + text */
  withIcon: 'flex items-center gap-2',
} as const;

// ═══════════════════════════════════════════════════════════════
// LOADING PATTERNS
// ═══════════════════════════════════════════════════════════════

export const loading = {
  /** Skeleton placeholders */
  skeleton: {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full',
  },
  /** Spinner container */
  spinner: {
    center: 'flex items-center justify-center py-8',
    inline: 'flex items-center gap-2',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE PATTERNS
// ═══════════════════════════════════════════════════════════════

export const emptyState = {
  /** Full empty state layout */
  container: cn(
    'flex flex-col items-center justify-center',
    'py-12 text-center'
  ),
  /** Icon container (muted background) */
  icon: cn(
    'rounded-full bg-muted p-4 mb-4'
  ),
  /** Title text */
  title: 'text-lg font-medium',
  /** Description text */
  description: 'text-sm text-muted-foreground mt-1 max-w-sm',
  /** Action button spacing */
  action: 'mt-4',
} as const;

// ═══════════════════════════════════════════════════════════════
// FORM PATTERNS
// ═══════════════════════════════════════════════════════════════

export const forms = {
  /** Form field wrapper */
  field: 'space-y-2',
  /** Form section spacing */
  section: 'space-y-4',
  /** Inline form group */
  inline: 'flex items-center gap-4',
  /** Label with required indicator */
  label: {
    default: 'text-sm font-medium',
    required: 'text-sm font-medium after:content-["*"] after:ml-0.5 after:text-destructive',
  },
  /** Error message */
  error: 'text-xs text-destructive mt-1',
  /** Helper text */
  help: 'text-xs text-muted-foreground mt-1',
} as const;

// ═══════════════════════════════════════════════════════════════
// LIST PATTERNS
// ═══════════════════════════════════════════════════════════════

export const lists = {
  /** Vertical list with dividers */
  divided: cn(
    'space-y-0',
    '[&>*]:py-4 [&>*]:border-b last:[&>*]:border-b-0'
  ),
  /** Card list (grid) */
  grid: {
    responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    dense: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
  },
  /** Horizontal scrollable list */
  horizontal: cn(
    'flex gap-4 overflow-x-auto',
    'pb-2', // space for scrollbar
    'snap-x snap-mandatory'
  ),
} as const;

// ═══════════════════════════════════════════════════════════════
// AVATAR PATTERNS
// ═══════════════════════════════════════════════════════════════

export const avatars = {
  /** Avatar sizes */
  size: {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  },
  /** Avatar with badge (online indicator, notification count) */
  withBadge: 'relative',
  /** Badge position */
  badge: {
    topRight: 'absolute -top-1 -right-1',
    bottomRight: 'absolute -bottom-0.5 -right-0.5',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// FOCUS PATTERNS (Accessibility)
// ═══════════════════════════════════════════════════════════════

export const focus = {
  /** Focus ring (WCAG 2.4.7 compliant) */
  ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  /** Focus ring for dark backgrounds */
  ringOnDark: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
} as const;

// ═══════════════════════════════════════════════════════════════
// TRANSITION PATTERNS
// ═══════════════════════════════════════════════════════════════

export const transitions = {
  /** Default transition */
  default: 'transition-all duration-200',
  /** Slower, smoother transition */
  smooth: 'transition-all duration-300 ease-out',
  /** Fast snappy transition */
  fast: 'transition-all duration-150',
  /** Color transitions only */
  colors: 'transition-colors duration-200',
} as const;

// ═══════════════════════════════════════════════════════════════
// SPACING TOKEN MAPPINGS (for primitives)
// ═══════════════════════════════════════════════════════════════

/**
 * Spacing token to Tailwind class value mapping
 * Used internally by layout primitives (Box, Stack, Inline)
 *
 * All values follow 4px grid system:
 * - xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px
 */
export const spacingMap = {
  none: '0',
  xs: '1', // 4px
  sm: '2', // 8px
  md: '4', // 16px
  lg: '6', // 24px
  xl: '8', // 32px
  '2xl': '12', // 48px
} as const;

export type SpacingMapToken = keyof typeof spacingMap;

// ═══════════════════════════════════════════════════════════════
// PAGE LAYOUT PATTERNS
// ═══════════════════════════════════════════════════════════════

/**
 * Page-level layout patterns for consistent wrapper styling.
 * These map to PageWrapper variants.
 *
 * @example
 * // With PageWrapper component
 * <PageWrapper variant="fullWidth">
 *
 * // Raw classes (if needed)
 * <div className={pageLayouts.fullWidth}>
 */
export const pageLayouts = {
  /** Dashboard, Messages, Topics - full width with vertical spacing */
  fullWidth: cn(
    'space-y-4 sm:space-y-6 md:space-y-6',
    'max-w-full overflow-hidden',
    'animate-fade-in'
  ),
  /** Settings, Forms - centered with max-width constraint */
  centered: cn(
    'mx-auto max-w-3xl',
    'space-y-6',
    'p-4 md:p-6 lg:p-8'
  ),
  /** Detail pages - wider max-width for content-heavy pages */
  wide: cn(
    'mx-auto max-w-5xl',
    'space-y-6'
  ),
  /** Onboarding, Wizards - tight max-width for focused flows */
  narrow: cn(
    'mx-auto max-w-2xl',
    'space-y-6',
    'p-4 md:p-6'
  ),
  /** Search page - centered with generous padding */
  search: cn(
    'mx-auto max-w-7xl',
    'py-6 md:py-12',
    'px-4 md:px-6'
  ),
} as const;

export type PageLayoutVariant = keyof typeof pageLayouts;
