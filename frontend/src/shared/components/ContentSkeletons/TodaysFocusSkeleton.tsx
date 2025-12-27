/**
 * TodaysFocusSkeleton
 *
 * Content-aware skeleton for TodaysFocus component.
 * Shows a card with title and list of focus items.
 */

import { Card, CardHeader, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

/**
 * Single focus item skeleton
 */
export function FocusItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-2">
      {/* Priority indicator */}
      <Skeleton className="h-2 w-2 rounded-full shrink-0" />
      {/* Content */}
      <Skeleton className="h-4 w-full" />
    </div>
  )
}

export interface TodaysFocusSkeletonProps {
  /** Number of focus items to display. Defaults to 3. */
  itemCount?: number
}

/**
 * TodaysFocus card skeleton with header and items
 */
export function TodaysFocusSkeleton({ itemCount = 3 }: TodaysFocusSkeletonProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: itemCount }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * ActionItem skeleton for task-like items
 */
export function ActionItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      {/* Checkbox */}
      <Skeleton className="h-5 w-5 rounded shrink-0" />
      <div className="flex-1 space-y-2">
        {/* Title */}
        <Skeleton className="h-4 w-3/4" />
        {/* Meta info */}
        <Skeleton className="h-3 w-1/2" />
      </div>
      {/* Priority badge */}
      <Skeleton className="h-6 w-16 rounded-full shrink-0" />
    </div>
  )
}

export interface ActionListSkeletonProps {
  /** Number of action items to display. Defaults to 5. */
  count?: number
}

/**
 * List of action item skeletons
 */
export function ActionListSkeleton({ count = 5 }: ActionListSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <ActionItemSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Daily summary card skeleton
 */
export function DailySummarySkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        </div>
        {/* Divider */}
        <Skeleton className="h-px w-full" />
        {/* Focus items */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}
