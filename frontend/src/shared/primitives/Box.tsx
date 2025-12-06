/**
 * Box Primitive
 *
 * The foundational layout primitive. Box is a polymorphic container that
 * provides type-safe spacing, background, and rounding through tokens.
 *
 * Design rationale:
 * - All spacing values are constrained to 4px grid (WCAG compliance)
 * - Background colors use semantic tokens for theme consistency
 * - Polymorphic `as` prop for semantic HTML elements
 *
 * @example
 * // Simple container with padding
 * <Box padding="md">Content</Box>
 *
 * // Semantic section with background
 * <Box as="section" padding="lg" background="muted" rounded="lg">
 *   <h2>Section Title</h2>
 * </Box>
 *
 * @see https://atlassian.design/components/primitives/box
 */

import React, { forwardRef, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

// ═══════════════════════════════════════════════════════════════
// TOKEN MAPPINGS
// ═══════════════════════════════════════════════════════════════

/**
 * Spacing token → Tailwind class mapping
 * All values follow 4px grid system
 */
const spacingMap = {
  none: '0',
  xs: '1', // 4px
  sm: '2', // 8px
  md: '4', // 16px
  lg: '6', // 24px
  xl: '8', // 32px
  '2xl': '12', // 48px
} as const;

/**
 * Background token → Tailwind class mapping
 * Uses semantic color tokens from the design system
 */
const backgroundMap = {
  default: 'bg-background',
  muted: 'bg-muted',
  accent: 'bg-accent',
  card: 'bg-card',
  popover: 'bg-popover',
} as const;

/**
 * Border radius token → Tailwind class mapping
 */
const roundedMap = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type SpacingToken = keyof typeof spacingMap;
export type BackgroundToken = keyof typeof backgroundMap;
export type RoundedToken = keyof typeof roundedMap;

export type BoxElement = 'div' | 'section' | 'article' | 'aside' | 'main' | 'nav' | 'header' | 'footer';

export interface BoxProps {
  /** Uniform padding on all sides */
  padding?: SpacingToken;
  /** Horizontal padding (left/right) - overrides `padding` */
  paddingX?: SpacingToken;
  /** Vertical padding (top/bottom) - overrides `padding` */
  paddingY?: SpacingToken;
  /** Top padding - overrides `paddingY` and `padding` */
  paddingTop?: SpacingToken;
  /** Bottom padding - overrides `paddingY` and `padding` */
  paddingBottom?: SpacingToken;
  /** Left padding - overrides `paddingX` and `padding` */
  paddingLeft?: SpacingToken;
  /** Right padding - overrides `paddingX` and `padding` */
  paddingRight?: SpacingToken;
  /** Uniform margin on all sides */
  margin?: SpacingToken;
  /** Horizontal margin (left/right) */
  marginX?: SpacingToken;
  /** Vertical margin (top/bottom) */
  marginY?: SpacingToken;
  /** Background color using semantic tokens */
  background?: BackgroundToken;
  /** Border radius */
  rounded?: RoundedToken;
  /** Render as different HTML element */
  as?: BoxElement;
  /** Additional Tailwind classes */
  className?: string;
  /** Box contents */
  children?: ReactNode;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Build padding classes from tokens
 */
function buildPaddingClasses(props: BoxProps): string[] {
  const classes: string[] = [];
  const { padding, paddingX, paddingY, paddingTop, paddingBottom, paddingLeft, paddingRight } = props;

  // Apply in order of specificity (least to most specific)
  if (padding !== undefined) {
    classes.push(`p-${spacingMap[padding]}`);
  }
  if (paddingX !== undefined) {
    classes.push(`px-${spacingMap[paddingX]}`);
  }
  if (paddingY !== undefined) {
    classes.push(`py-${spacingMap[paddingY]}`);
  }
  if (paddingTop !== undefined) {
    classes.push(`pt-${spacingMap[paddingTop]}`);
  }
  if (paddingBottom !== undefined) {
    classes.push(`pb-${spacingMap[paddingBottom]}`);
  }
  if (paddingLeft !== undefined) {
    classes.push(`pl-${spacingMap[paddingLeft]}`);
  }
  if (paddingRight !== undefined) {
    classes.push(`pr-${spacingMap[paddingRight]}`);
  }

  return classes;
}

/**
 * Build margin classes from tokens
 */
function buildMarginClasses(props: BoxProps): string[] {
  const classes: string[] = [];
  const { margin, marginX, marginY } = props;

  if (margin !== undefined) {
    classes.push(`m-${spacingMap[margin]}`);
  }
  if (marginX !== undefined) {
    classes.push(`mx-${spacingMap[marginX]}`);
  }
  if (marginY !== undefined) {
    classes.push(`my-${spacingMap[marginY]}`);
  }

  return classes;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Box - Foundational layout primitive
 *
 * Provides type-safe API for spacing, background, and rounding.
 * Use Box when you need a simple container with consistent styling.
 */
export const Box = forwardRef<HTMLElement, BoxProps>(
  (
    {
      as: Element = 'div',
      padding,
      paddingX,
      paddingY,
      paddingTop,
      paddingBottom,
      paddingLeft,
      paddingRight,
      margin,
      marginX,
      marginY,
      background,
      rounded,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const paddingClasses = buildPaddingClasses({
      padding,
      paddingX,
      paddingY,
      paddingTop,
      paddingBottom,
      paddingLeft,
      paddingRight,
    });
    const marginClasses = buildMarginClasses({ margin, marginX, marginY });

    const classes = cn(
      // Padding
      ...paddingClasses,
      // Margin
      ...marginClasses,
      // Background
      background && backgroundMap[background],
      // Rounded
      rounded && roundedMap[rounded],
      // Custom classes (last for override capability)
      className
    );

    return (
      <Element ref={ref as React.Ref<HTMLDivElement>} className={classes || undefined} {...props}>
        {children}
      </Element>
    );
  }
);

Box.displayName = 'Box';

export default Box;
