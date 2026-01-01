// UI Components (shadcn)
export { Button, buttonVariants } from '../ui/button'
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '../ui/card'
export { Badge, badgeVariants } from '../ui/badge'
export { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
export { Toaster } from '../ui/sonner'

// Custom Components
export { MetricCard } from './MetricCard'
export type { MetricCardProps } from './MetricCard'
export { TrendChart } from './TrendChart'
export type { TrendChartProps } from './TrendChart'
export { ActivityHeatmap } from './ActivityHeatmap'
export type { ActivityHeatmapProps, ActivityDataPoint } from './ActivityHeatmap'
export { AppSidebar } from './AppSidebar'
export { ColorPickerPopover } from './ColorPickerPopover'
export { AutoSaveToggle } from './AutoSaveToggle'
export { SaveStatusIndicator } from './SaveStatusIndicator'
export { PageHeader } from './PageHeader'
export type { PageHeaderProps } from './PageHeader'
export { UniversalThemeIcon } from './ThemeIcons'
export { AdminPanel } from './AdminPanel'
export type { AdminPanelProps } from './AdminPanel'
export { AdminBadge } from './AdminBadge'
export type { AdminBadgeProps } from './AdminBadge'
export { AdminFeatureBadge } from './AdminFeatureBadge'
export type { AdminFeatureBadgeProps } from './AdminFeatureBadge'
export { TooltipIconButton } from './TooltipIconButton'
export type { TooltipIconButtonProps } from './TooltipIconButton'
export { LanguageMismatchBadge } from './LanguageMismatchBadge'
export { SearchBar } from './SearchBar'
export type { SearchBarProps } from './SearchBar'
export { HumanizedLoader } from './HumanizedLoader'
export type { HumanizedLoaderProps, HumanizedLoaderVariant } from './HumanizedLoader'

// Content-aware Skeletons
export {
  // MetricCard
  MetricCardSkeleton,
  MetricCardSkeletonGrid,
  // Insights
  InsightCardSkeleton,
  InsightListSkeleton,
  TimelineInsightSkeleton,
  TimelineInsightsSkeleton,
  // Topics
  TopicItemSkeleton,
  TopicListSkeleton,
  TopTopicsCardSkeleton,
  TopicBadgesSkeleton,
  // Messages
  MessageCardSkeleton,
  MessageFeedSkeleton,
  MessageCompactSkeleton,
  MessageCompactListSkeleton,
  // TodaysFocus
  FocusItemSkeleton,
  TodaysFocusSkeleton,
  ActionItemSkeleton,
  ActionListSkeleton,
  DailySummarySkeleton,
} from './ContentSkeletons'
export type {
  MetricCardSkeletonGridProps,
  InsightListSkeletonProps,
  TimelineInsightsSkeletonProps,
  TopicListSkeletonProps,
  MessageFeedSkeletonProps,
  MessageCompactListSkeletonProps,
  TodaysFocusSkeletonProps,
  ActionListSkeletonProps,
} from './ContentSkeletons'