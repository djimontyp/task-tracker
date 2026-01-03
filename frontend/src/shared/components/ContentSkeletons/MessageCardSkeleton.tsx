/**
 * MessageCardSkeleton
 *
 * Content-aware skeleton for MessagesPage feed view.
 * Matches MessageCard layout with avatar, author, content, and badges.
 */

import { Skeleton } from '@/shared/ui/skeleton'
import { Card } from '@/shared/ui/card'

/**
 * Single message card skeleton
 */
export function MessageCardSkeleton() {
  return (
    <Card className="p-4 space-y-4">
      {/* Header: checkbox, avatar, author, status badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          {/* Checkbox */}
          <Skeleton className="h-4 w-4 rounded shrink-0" />
          {/* Avatar */}
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          {/* Author name */}
          <Skeleton className="h-4 w-24" />
        </div>
        {/* Status badge */}
        <Skeleton className="h-6 w-16 rounded-full shrink-0" />
      </div>

      {/* Content lines */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Footer: badges and timestamp */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>
    </Card>
  )
}

export interface MessageFeedSkeletonProps {
  /** Number of message cards to display. Defaults to 5. */
  count?: number
}

/**
 * Message feed skeleton with multiple cards
 */
export function MessageFeedSkeleton({ count = 5 }: MessageFeedSkeletonProps) {
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {Array.from({ length: count }).map((_, i) => (
        <MessageCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Compact message skeleton for smaller displays
 */
export function MessageCompactSkeleton() {
  return (
    <Card className="flex items-center gap-4 p-4">
      {/* Avatar */}
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        {/* Author + time */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* Content preview */}
        <Skeleton className="h-4 w-full" />
      </div>
      {/* Badge */}
      <Skeleton className="h-6 w-16 rounded-full shrink-0" />
    </Card>
  )
}

export interface MessageCompactListSkeletonProps {
  /** Number of compact messages to display. Defaults to 10. */
  count?: number
}

/**
 * List of compact message skeletons
 */
export function MessageCompactListSkeleton({ count = 10 }: MessageCompactListSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <MessageCompactSkeleton key={i} />
      ))}
    </div>
  )
}
