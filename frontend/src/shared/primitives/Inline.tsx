/**
 * Inline Primitive
 *
 * Horizontal layout primitive for inline elements like buttons,
 * badges, icons with text, or any row of items.
 *
 * @example
 * // Button group
 * <Inline gap="sm">
 *   <Button>Cancel</Button>
 *   <Button variant="primary">Save</Button>
 * </Inline>
 *
 * // Icon with text
 * <Inline gap="xs" align="center">
 *   <CheckIcon />
 *   <span>Connected</span>
 * </Inline>
 *
 * // Responsive wrapping
 * <Inline gap="sm" wrap>
 *   {tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
 * </Inline>
 *
 * @see https://paste.twilio.design/primitives/box
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
  baseline: 'items-baseline',
  stretch: 'items-stretch',
} as const;

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
} as const;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type AlignToken = keyof typeof alignMap;
export type JustifyToken = keyof typeof justifyMap;

export interface InlineProps {
  /** Gap between inline items (default: sm = 8px) */
  gap?: SpacingToken;
  /** Vertical alignment of items */
  align?: AlignToken;
  /** Horizontal distribution of items */
  justify?: JustifyToken;
  /** Allow items to wrap to next line */
  wrap?: boolean;
  /** Reverse order of items */
  reverse?: boolean;
  /** Render as different HTML element */
  as?: BoxElement;
  /** Additional Tailwind classes */
  className?: string;
  /** Inline contents */
  children?: ReactNode;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Inline - Horizontal layout primitive
 *
 * Use Inline for button groups, icon+text combinations,
 * tag lists, or any content that flows left-to-right.
 *
 * The `wrap` prop enables responsive behavior where items
 * wrap to the next line on smaller screens.
 */
export const Inline = forwardRef<HTMLElement, InlineProps>(
  (
    { as: Element = 'div', gap = 'sm', align = 'center', justify, wrap = false, reverse = false, className, children, ...props },
    ref
  ) => {
    const classes = cn(
      // Flex row layout
      'flex',
      reverse ? 'flex-row-reverse' : 'flex-row',
      // Wrapping
      wrap && 'flex-wrap',
      // Gap spacing
      gapMap[gap],
      // Alignment
      alignMap[align],
      // Justify
      justify && justifyMap[justify],
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

Inline.displayName = 'Inline';

export default Inline;
