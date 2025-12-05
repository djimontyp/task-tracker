/**
 * Design System Color Tokens
 *
 * Type-safe utilities for semantic colors.
 * All classes use CSS variables defined in index.css.
 *
 * @example
 * import { semantic, status } from '@/shared/tokens/colors';
 * <Badge className={semantic.success.bg}>Connected</Badge>
 * <Alert className={status.error.text}>Error occurred</Alert>
 *
 * @see docs/design-system/01-colors.md
 */

// ═══════════════════════════════════════════════════════════════
// SEMANTIC COLORS (General purpose)
// ═══════════════════════════════════════════════════════════════

export const semantic = {
  success: {
    bg: 'bg-semantic-success',
    text: 'text-semantic-success',
    border: 'border-semantic-success',
    ring: 'ring-semantic-success',
  },
  warning: {
    bg: 'bg-semantic-warning',
    text: 'text-semantic-warning',
    border: 'border-semantic-warning',
    ring: 'ring-semantic-warning',
  },
  error: {
    bg: 'bg-semantic-error',
    text: 'text-semantic-error',
    border: 'border-semantic-error',
    ring: 'ring-semantic-error',
  },
  info: {
    bg: 'bg-semantic-info',
    text: 'text-semantic-info',
    border: 'border-semantic-info',
    ring: 'ring-semantic-info',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// STATUS COLORS (Connection states)
// ═══════════════════════════════════════════════════════════════

export const status = {
  connected: {
    bg: 'bg-status-connected',
    text: 'text-status-connected',
    border: 'border-status-connected',
    ring: 'ring-status-connected',
  },
  validating: {
    bg: 'bg-status-validating',
    text: 'text-status-validating',
    border: 'border-status-validating',
    ring: 'ring-status-validating',
  },
  pending: {
    bg: 'bg-status-pending',
    text: 'text-status-pending',
    border: 'border-status-pending',
    ring: 'ring-status-pending',
  },
  error: {
    bg: 'bg-status-error',
    text: 'text-status-error',
    border: 'border-status-error',
    ring: 'ring-status-error',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// ATOM TYPE COLORS (Knowledge atoms)
// ═══════════════════════════════════════════════════════════════

export const atom = {
  problem: {
    bg: 'bg-atom-problem',
    text: 'text-atom-problem',
    border: 'border-atom-problem',
  },
  solution: {
    bg: 'bg-atom-solution',
    text: 'text-atom-solution',
    border: 'border-atom-solution',
  },
  decision: {
    bg: 'bg-atom-decision',
    text: 'text-atom-decision',
    border: 'border-atom-decision',
  },
  question: {
    bg: 'bg-atom-question',
    text: 'text-atom-question',
    border: 'border-atom-question',
  },
  insight: {
    bg: 'bg-atom-insight',
    text: 'text-atom-insight',
    border: 'border-atom-insight',
  },
  pattern: {
    bg: 'bg-atom-pattern',
    text: 'text-atom-pattern',
    border: 'border-atom-pattern',
  },
  requirement: {
    bg: 'bg-atom-requirement',
    text: 'text-atom-requirement',
    border: 'border-atom-requirement',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// CHART COLORS (Data visualization)
// ═══════════════════════════════════════════════════════════════

export const chart = {
  signal: {
    bg: 'bg-chart-signal',
    text: 'text-chart-signal',
    fill: 'fill-chart-signal',
    stroke: 'stroke-chart-signal',
  },
  noise: {
    bg: 'bg-chart-noise',
    text: 'text-chart-noise',
    fill: 'fill-chart-noise',
    stroke: 'stroke-chart-noise',
  },
  weakSignal: {
    bg: 'bg-chart-weak-signal',
    text: 'text-chart-weak-signal',
    fill: 'fill-chart-weak-signal',
    stroke: 'stroke-chart-weak-signal',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// BRAND COLORS (External services)
// ═══════════════════════════════════════════════════════════════

export const brand = {
  telegram: {
    bg: 'bg-brand-telegram',
    text: 'text-brand-telegram',
    border: 'border-brand-telegram',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// BASE COLORS (shadcn/ui system)
// ═══════════════════════════════════════════════════════════════

export const base = {
  background: {
    bg: 'bg-background',
    text: 'text-background',
  },
  foreground: {
    bg: 'bg-foreground',
    text: 'text-foreground',
  },
  primary: {
    bg: 'bg-primary',
    text: 'text-primary',
    foreground: 'text-primary-foreground',
    border: 'border-primary',
    ring: 'ring-primary',
  },
  secondary: {
    bg: 'bg-secondary',
    text: 'text-secondary',
    foreground: 'text-secondary-foreground',
  },
  muted: {
    bg: 'bg-muted',
    text: 'text-muted',
    foreground: 'text-muted-foreground',
  },
  accent: {
    bg: 'bg-accent',
    text: 'text-accent',
    foreground: 'text-accent-foreground',
  },
  destructive: {
    bg: 'bg-destructive',
    text: 'text-destructive',
    foreground: 'text-destructive-foreground',
    border: 'border-destructive',
  },
  card: {
    bg: 'bg-card',
    text: 'text-card',
    foreground: 'text-card-foreground',
  },
  popover: {
    bg: 'bg-popover',
    text: 'text-popover',
    foreground: 'text-popover-foreground',
  },
  border: 'border-border',
  input: 'border-input',
  ring: 'ring-ring',
} as const;

// ═══════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════

export type SemanticColor = keyof typeof semantic;
export type StatusColor = keyof typeof status;
export type AtomColor = keyof typeof atom;
export type ChartColor = keyof typeof chart;
