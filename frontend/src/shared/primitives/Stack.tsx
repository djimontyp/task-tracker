/**
 * Stack Primitive
 *
 * Vertical layout primitive for consistent vertical spacing.
 * Stack uses CSS gap (not space-y) for more predictable spacing
 * that doesn't depend on child element count or order.
 *
 * @example
 * // Basic stack with default spacing
 * <Stack gap="md">
 *   <Card>First</Card>
 *   <Card>Second</Card>
 * </Stack>
 *
 * // Stack with alignment
 * <Stack gap="lg" align="center">
 *   <Avatar />
 *   <Text>Name</Text>
 * </Stack>
 *
 * @see https://chakra-ui.com/docs/components/stack
 */

import React, { forwardRef, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { type SpacingToken, type BoxElement } from './Box';

// ═══════════════════════════════════════════════════════════════
// TOKEN MAPPINGS
// ═══════════════════════════════════════════════════════════════

const gapMap = {
  none: 'gap-0',
  xs: 'gap-1', // 4px
  sm: 'gap-2', // 8px
  md: 'gap-4', // 16px
  lg: 'gap-6', // 24px
  xl: 'gap-8', // 32px
  '2xl': 'gap-12', // 48px
} as const;

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
} as const;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type AlignToken = keyof typeof alignMap;

export interface StackProps {
  /** Gap between stack items (default: md = 16px) */
  gap?: SpacingToken;
  /** Horizontal alignment of items */
  align?: AlignToken;
  /** Whether to reverse the order of items */
  reverse?: boolean;
  /** Render as different HTML element */
  as?: BoxElement;
  /** Additional Tailwind classes */
  className?: string;
  /** Stack contents */
  children?: ReactNode;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Stack - Vertical layout primitive
 *
 * Use Stack for vertical lists, form fields, card sections,
 * or any content that flows top-to-bottom.
 *
 * Benefits over raw `space-y-*`:
 * - Gap works correctly with conditional children
 * - Gap doesn't affect first/last element margins
 * - Type-safe API prevents magic values
 */
export const Stack = forwardRef<HTMLElement, StackProps>(
  ({ as: Element = 'div', gap = 'md', align, reverse = false, className, children, ...props }, ref) => {
    const classes = cn(
      // Flex column layout
      'flex',
      reverse ? 'flex-col-reverse' : 'flex-col',
      // Gap spacing
      gapMap[gap],
      // Alignment
      align && alignMap[align],
      // Custom classes
      className
    );

    return (
      <Element ref={ref as React.Ref<HTMLDivElement>} className={classes} {...props}>
        {children}
      </Element>
    );
  }
);

Stack.displayName = 'Stack';

export default Stack;
