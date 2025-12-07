/**
 * Center Primitive
 *
 * Simple centering primitive that centers its children both
 * horizontally and vertically (or just horizontally).
 *
 * @example
 * // Center content in the viewport
 * <Center fullHeight>
 *   <LoginForm />
 * </Center>
 *
 * // Horizontal centering only
 * <Center>
 *   <h1>Page Title</h1>
 * </Center>
 *
 * // Center with max width
 * <Center maxWidth="3xl">
 *   <ArticleContent />
 * </Center>
 *
 * @see https://chakra-ui.com/docs/components/center
 */

import React, { forwardRef, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { type BoxElement } from './Box';

// ═══════════════════════════════════════════════════════════════
// TOKEN MAPPINGS
// ═══════════════════════════════════════════════════════════════

const maxWidthMap = {
  xs: 'max-w-xs', // 320px
  sm: 'max-w-sm', // 384px
  md: 'max-w-md', // 448px
  lg: 'max-w-lg', // 512px
  xl: 'max-w-xl', // 576px
  '2xl': 'max-w-2xl', // 672px
  '3xl': 'max-w-3xl', // 768px
  '4xl': 'max-w-4xl', // 896px
  '5xl': 'max-w-5xl', // 1024px
  '6xl': 'max-w-6xl', // 1152px
  '7xl': 'max-w-7xl', // 1280px
  full: 'max-w-full', // 100%
  prose: 'max-w-prose', // 65ch
} as const;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type MaxWidthToken = keyof typeof maxWidthMap;

export interface CenterProps {
  /** Whether to center vertically (takes full height) */
  fullHeight?: boolean;
  /** Maximum width constraint with auto margins */
  maxWidth?: MaxWidthToken;
  /** Whether content is inline (uses inline-flex instead of flex) */
  inline?: boolean;
  /** Render as different HTML element */
  as?: BoxElement;
  /** Additional Tailwind classes */
  className?: string;
  /** Center contents */
  children?: ReactNode;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Center - Centering primitive
 *
 * Use Center for:
 * - Login/signup pages (fullHeight)
 * - Empty states
 * - Page headers
 * - Max-width content containers
 */
export const Center = forwardRef<HTMLElement, CenterProps>(
  ({ as: Element = 'div', fullHeight = false, maxWidth, inline = false, className, children, ...props }, ref) => {
    // Different approaches based on use case
    const isMaxWidthOnly = maxWidth && !fullHeight && !inline;

    const classes = cn(
      // For max-width centering without vertical centering
      isMaxWidthOnly && ['mx-auto', maxWidthMap[maxWidth]],
      // For flex-based centering
      !isMaxWidthOnly && [
        inline ? 'inline-flex' : 'flex',
        'items-center',
        'justify-center',
        fullHeight && 'w-full h-full min-h-screen',
        maxWidth && maxWidthMap[maxWidth],
      ],
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

Center.displayName = 'Center';

export default Center;
