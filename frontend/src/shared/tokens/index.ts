/**
 * Design System Tokens
 *
 * Central export point for all design tokens.
 * Import from this file to get type-safe, consistent styling utilities.
 *
 * @example
 * // Import specific tokens
 * import { semantic, gap, badges } from '@/shared/tokens';
 *
 * // Use in components
 * <Badge className={badges.status.connected}>
 * <div className={gap.md}>
 * <Alert className={semantic.error.bg}>
 *
 * @see docs/design-system/README.md
 */

// Colors
export {
  semantic,
  status,
  atom,
  chart,
  brand,
  base,
  type SemanticColor,
  type StatusColor,
  type AtomColor,
  type ChartColor,
} from './colors';

// Spacing
export {
  gap,
  padding,
  margin,
  spacing,
  touchTarget,
  radius,
  type GapSize,
  type PaddingPreset,
  type SpacingDirection,
} from './spacing';

// Z-Index
export {
  zIndex,
  zIndexClasses,
  getZIndex,
  type ZIndexToken,
  type ZIndexValue,
} from './zindex';

// Patterns
export {
  badges,
  cards,
  buttons,
  loading,
  emptyState,
  forms,
  lists,
  avatars,
  focus,
  transitions,
  // Layout patterns
  spacingMap,
  pageLayouts,
  // Status indicators
  statusIndicators,
  type SpacingMapToken,
  type PageLayoutVariant,
  type StatusIndicatorVariant,
} from './patterns';
