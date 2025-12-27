/**
 * ContentSkeletons
 *
 * Content-aware skeleton components for better loading UX.
 * These skeletons match the layout of actual content components.
 */

// MetricCard skeletons
export {
  MetricCardSkeleton,
  MetricCardSkeletonGrid,
} from './MetricCardSkeleton'
export type { MetricCardSkeletonGridProps } from './MetricCardSkeleton'

// Insight skeletons
export {
  InsightCardSkeleton,
  InsightListSkeleton,
  TimelineInsightSkeleton,
  TimelineInsightsSkeleton,
} from './InsightCardSkeleton'
export type {
  InsightListSkeletonProps,
  TimelineInsightsSkeletonProps,
} from './InsightCardSkeleton'

// Topic skeletons
export {
  TopicItemSkeleton,
  TopicListSkeleton,
  TopTopicsCardSkeleton,
  TopicBadgesSkeleton,
} from './TopicListSkeleton'
export type { TopicListSkeletonProps } from './TopicListSkeleton'

// Message skeletons
export {
  MessageCardSkeleton,
  MessageFeedSkeleton,
  MessageCompactSkeleton,
  MessageCompactListSkeleton,
} from './MessageCardSkeleton'
export type {
  MessageFeedSkeletonProps,
  MessageCompactListSkeletonProps,
} from './MessageCardSkeleton'

// TodaysFocus skeletons
export {
  FocusItemSkeleton,
  TodaysFocusSkeleton,
  ActionItemSkeleton,
  ActionListSkeleton,
  DailySummarySkeleton,
} from './TodaysFocusSkeleton'
export type {
  TodaysFocusSkeletonProps,
  ActionListSkeletonProps,
} from './TodaysFocusSkeleton'
