/**
 * PageWrapper Primitive
 *
 * Page-level layout primitive that provides consistent spacing,
 * width constraints, and responsive behavior across all pages.
 *
 * Variants:
 * - fullWidth: Dashboard, Messages, Topics - full width with vertical spacing
 * - centered: Settings, Forms - centered with max-width constraint
 * - wide: Detail pages - wider max-width for content-heavy pages
 * - narrow: Onboarding, Wizards - tight max-width for focused flows
 * - search: Search page specific - centered content with extra padding
 *
 * @example
 * // Dashboard with full width
 * <PageWrapper variant="fullWidth">
 *   <MetricsDashboard />
 *   <TopicsGrid />
 * </PageWrapper>
 *
 * // Settings form centered
 * <PageWrapper variant="centered">
 *   <SettingsForm />
 * </PageWrapper>
 *
 * // Search page with centered empty state
 * <PageWrapper variant="search">
 *   <SearchResults />
 * </PageWrapper>
 */

import React, { forwardRef, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

// ═══════════════════════════════════════════════════════════════
// VARIANT DEFINITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Page layout variants with their Tailwind classes.
 *
 * Design rationale:
 * - All use responsive spacing (smaller on mobile, larger on desktop)
 * - fullWidth: No max-width constraint, works for dashboards/lists
 * - centered: max-w-3xl for forms, settings
 * - wide: max-w-5xl for detail pages with more content
 * - narrow: max-w-2xl for onboarding, focused flows
 * - search: Centered with generous padding for search UI
 */
const variantStyles = {
  fullWidth: cn(
    // Vertical spacing - responsive
    'space-y-4 sm:space-y-6 md:space-y-6',
    // Prevent horizontal overflow
    'max-w-full overflow-hidden',
    // Entrance animation
    'animate-fade-in'
  ),
  centered: cn(
    // Horizontal centering
    'mx-auto',
    // Max width constraint
    'max-w-3xl',
    // Vertical spacing
    'space-y-6',
    // Responsive padding
    'p-4 md:p-6 lg:p-8'
  ),
  wide: cn(
    // Horizontal centering
    'mx-auto',
    // Wider max width
    'max-w-5xl',
    // Vertical spacing
    'space-y-6'
  ),
  narrow: cn(
    // Horizontal centering
    'mx-auto',
    // Tight max width
    'max-w-2xl',
    // Vertical spacing
    'space-y-6',
    // Responsive padding
    'p-4 md:p-6'
  ),
  search: cn(
    // Container-like behavior without using 'container'
    'w-full mx-auto max-w-7xl',
    // Generous vertical padding
    'py-6 md:py-12',
    // Horizontal padding
    'px-4 md:px-6'
  ),
} as const;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type PageVariant = keyof typeof variantStyles;

export interface PageWrapperProps {
  /**
   * Layout variant
   * @default 'fullWidth'
   */
  variant?: PageVariant;
  /**
   * Render as different HTML element
   * @default 'div'
   */
  as?: 'div' | 'main' | 'section' | 'article';
  /**
   * Additional Tailwind classes
   */
  className?: string;
  /**
   * Page contents
   */
  children?: ReactNode;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * PageWrapper - Page-level layout primitive
 *
 * Use PageWrapper at the root of every page component to ensure
 * consistent spacing, width constraints, and responsive behavior.
 *
 * Benefits:
 * - Eliminates ad-hoc wrapper divs with inconsistent classes
 * - Type-safe variant selection
 * - ESLint enforcement via no-raw-page-wrapper rule
 * - Easy to update all pages by changing variant styles
 *
 * @example
 * // Before (inconsistent)
 * <div className="container py-12">...</div>
 * <div className="space-y-4 max-w-full">...</div>
 * <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6 lg:p-8">...</div>
 *
 * // After (consistent)
 * <PageWrapper variant="search">...</PageWrapper>
 * <PageWrapper variant="fullWidth">...</PageWrapper>
 * <PageWrapper variant="centered">...</PageWrapper>
 */
export const PageWrapper = forwardRef<HTMLElement, PageWrapperProps>(
  ({ variant = 'fullWidth', as: Element = 'div', className, children, ...props }, ref) => {
    const classes = cn(
      // Base variant styles
      variantStyles[variant],
      // Custom classes (can override)
      className
    );

    return (
      <Element ref={ref as React.Ref<HTMLDivElement>} className={classes} {...props}>
        {children}
      </Element>
    );
  }
);

PageWrapper.displayName = 'PageWrapper';

// Export variant styles for advanced use cases
export { variantStyles as pageVariantStyles };

export default PageWrapper;
