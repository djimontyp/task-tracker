/**
 * MetricCardSkeleton
 *
 * Content-aware skeleton for DashboardMetrics component.
 * Matches the layout of MetricCard with icon, value, and label.
 */

import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

export function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          {/* Icon placeholder */}
          <Skeleton className="h-10 w-10 rounded-lg" />
          {/* Trend indicator placeholder */}
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        <div className="mt-4 space-y-2">
          {/* Value placeholder */}
          <Skeleton className="h-8 w-16" />
          {/* Label placeholder */}
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

export interface MetricCardSkeletonGridProps {
  /** Number of skeleton cards to display. Defaults to 4. */
  count?: number
}

export function MetricCardSkeletonGrid({ count = 4 }: MetricCardSkeletonGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  )
}
