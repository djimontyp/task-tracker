/**
 * InsightCardSkeleton
 *
 * Content-aware skeleton for RecentInsights component.
 * Matches the timeline layout with icon dot, content card, and connecting line.
 */

import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

export function InsightCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 flex gap-4">
        {/* Icon placeholder */}
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          {/* Title placeholder */}
          <Skeleton className="h-4 w-3/4" />
          {/* Subtitle placeholder */}
          <Skeleton className="h-3 w-1/2" />
        </div>
      </CardContent>
    </Card>
  )
}

export interface InsightListSkeletonProps {
  /** Number of skeleton cards to display. Defaults to 3. */
  count?: number
}

export function InsightListSkeleton({ count = 3 }: InsightListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <InsightCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * TimelineInsightSkeleton
 *
 * Matches the actual RecentInsights timeline layout with dot, line, and card.
 */
export function TimelineInsightSkeleton() {
  return (
    <div className="relative flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        {/* Dot */}
        <Skeleton className="h-10 w-10 rounded-full ring-4 ring-background shrink-0" />
        {/* Connecting line */}
        <div className="w-0.5 flex-1 bg-border" aria-hidden="true" />
      </div>

      {/* Content card */}
      <div className="flex-1 pb-8">
        <div className="rounded-lg border bg-card p-4">
          {/* Header: Type + Time */}
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          {/* Title */}
          <Skeleton className="h-4 w-3/4 mb-2" />
          {/* Content preview */}
          <Skeleton className="h-3 w-full mb-2" />
          {/* Topic */}
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

export interface TimelineInsightsSkeletonProps {
  /** Number of timeline items to display. Defaults to 3. */
  count?: number
}

export function TimelineInsightsSkeleton({ count = 3 }: TimelineInsightsSkeletonProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-0">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <Skeleton className="h-10 w-10 rounded-full ring-4 ring-background shrink-0" />
                {i < count - 1 && (
                  <div className="w-0.5 flex-1 bg-border" aria-hidden="true" />
                )}
              </div>
              <div className={`flex-1 ${i < count - 1 ? 'pb-8' : 'pb-0'}`}>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
