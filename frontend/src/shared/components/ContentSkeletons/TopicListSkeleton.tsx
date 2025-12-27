/**
 * TopicListSkeleton
 *
 * Content-aware skeleton for TopTopics component.
 * Matches the list layout with icon, topic name, and stats.
 */

import { Card, CardHeader, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

/**
 * Single topic item skeleton matching TopicItem layout
 */
export function TopicItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      {/* Icon placeholder */}
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        {/* Topic name with rank */}
        <Skeleton className="h-3.5 w-2/3" />
        {/* Stats: atom count, message count */}
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

export interface TopicListSkeletonProps {
  /** Number of topic items to display. Defaults to 5. */
  count?: number
}

/**
 * List of topic item skeletons
 */
export function TopicListSkeleton({ count = 5 }: TopicListSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <TopicItemSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * TopTopics card skeleton with header
 */
export function TopTopicsCardSkeleton({ count = 5 }: TopicListSkeletonProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="pt-0">
        <TopicListSkeleton count={count} />
      </CardContent>
    </Card>
  )
}

/**
 * Horizontal topic badges skeleton (for compact displays)
 */
export function TopicBadgesSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-8 w-24 rounded-full" />
      <Skeleton className="h-8 w-32 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-full" />
      <Skeleton className="h-8 w-28 rounded-full" />
      <Skeleton className="h-8 w-16 rounded-full" />
    </div>
  )
}
