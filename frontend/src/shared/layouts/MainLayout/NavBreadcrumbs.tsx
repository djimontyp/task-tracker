import React from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb';
import { cn } from '@/shared/lib/utils';
import type { BreadcrumbSegment } from './useBreadcrumbs';

export interface NavBreadcrumbsProps {
  /** Array of breadcrumb segments */
  crumbs: BreadcrumbSegment[];
  /** Maximum width for each crumb item (CSS value) */
  maxWidth?: string;
  /** Variant for styling differences */
  variant?: 'mobile' | 'desktop';
  /** Optional className for customization */
  className?: string;
}

/**
 * NavBreadcrumbs - Renders breadcrumb navigation.
 *
 * Supports both mobile (smaller text, tighter spacing) and desktop variants.
 * Uses design system tokens for consistent styling.
 *
 * @example
 * <NavBreadcrumbs crumbs={[{ label: 'Home', href: '/' }, { label: 'Page' }]} />
 * <NavBreadcrumbs crumbs={crumbs} variant="mobile" />
 */
export function NavBreadcrumbs({
  crumbs,
  maxWidth,
  variant = 'desktop',
  className,
}: NavBreadcrumbsProps) {
  const isMobile = variant === 'mobile';
  const defaultMaxWidth = isMobile ? '120px' : '200px';
  const effectiveMaxWidth = maxWidth ?? defaultMaxWidth;

  return (
    <Breadcrumb className={cn('flex min-w-0', isMobile && 'pt-2', className)}>
      <BreadcrumbList
        className={cn('min-w-0', isMobile && 'flex-wrap overflow-hidden')}
      >
        {crumbs.map((segment, index) => {
          const isLast = index === crumbs.length - 1;
          const itemStyle = { maxWidth: effectiveMaxWidth };

          return (
            <React.Fragment key={`${segment.label}-${index}`}>
              <BreadcrumbItem
                className={cn(
                  'min-w-0',
                  isMobile && 'text-xs sm:text-sm'
                )}
                style={itemStyle}
              >
                {segment.href && !isLast ? (
                  <BreadcrumbLink asChild>
                    <Link to={segment.href} className="truncate block max-w-full">
                      {segment.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate block max-w-full">
                    {segment.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="shrink-0" />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
