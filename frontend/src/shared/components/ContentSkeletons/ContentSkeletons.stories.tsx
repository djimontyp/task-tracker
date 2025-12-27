/**
 * ContentSkeletons Stories
 *
 * Visual documentation for all content-aware skeleton components.
 * Shows skeletons in isolation and grouped layouts.
 */

import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  MetricCardSkeleton,
  MetricCardSkeletonGrid,
} from './MetricCardSkeleton'
import {
  InsightCardSkeleton,
  InsightListSkeleton,
  TimelineInsightSkeleton,
  TimelineInsightsSkeleton,
} from './InsightCardSkeleton'
import {
  TopicItemSkeleton,
  TopicListSkeleton,
  TopTopicsCardSkeleton,
  TopicBadgesSkeleton,
} from './TopicListSkeleton'
import {
  MessageCardSkeleton,
  MessageFeedSkeleton,
  MessageCompactSkeleton,
  MessageCompactListSkeleton,
} from './MessageCardSkeleton'
import {
  FocusItemSkeleton,
  TodaysFocusSkeleton,
  ActionItemSkeleton,
  ActionListSkeleton,
  DailySummarySkeleton,
} from './TodaysFocusSkeleton'

const meta: Meta = {
  title: 'Components/ContentSkeletons',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Content-aware skeleton components that match the layout of actual content for better loading UX.',
      },
    },
  },
}

export default meta

// ============================================================================
// MetricCard Skeletons
// ============================================================================

export const MetricCard: StoryObj = {
  render: () => <MetricCardSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Single metric card skeleton for DashboardMetrics.',
      },
    },
  },
}

export const MetricCardGrid: StoryObj = {
  render: () => <MetricCardSkeletonGrid />,
  parameters: {
    docs: {
      description: {
        story: 'Grid of 4 metric card skeletons matching DashboardMetrics layout.',
      },
    },
  },
}

export const MetricCardGridCustomCount: StoryObj = {
  render: () => <MetricCardSkeletonGrid count={6} />,
  parameters: {
    docs: {
      description: {
        story: 'Grid with custom count of metric cards.',
      },
    },
  },
}

// ============================================================================
// Insight Skeletons
// ============================================================================

export const InsightCard: StoryObj = {
  render: () => <InsightCardSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Single insight card skeleton.',
      },
    },
  },
}

export const InsightList: StoryObj = {
  render: () => <InsightListSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'List of insight card skeletons.',
      },
    },
  },
}

export const TimelineInsight: StoryObj = {
  render: () => <TimelineInsightSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Single timeline insight skeleton with dot, line, and card.',
      },
    },
  },
}

export const TimelineInsights: StoryObj = {
  render: () => <TimelineInsightsSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Full RecentInsights timeline skeleton with header.',
      },
    },
  },
}

// ============================================================================
// Topic Skeletons
// ============================================================================

export const TopicItem: StoryObj = {
  render: () => <TopicItemSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Single topic item skeleton.',
      },
    },
  },
}

export const TopicList: StoryObj = {
  render: () => <TopicListSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'List of topic item skeletons.',
      },
    },
  },
}

export const TopTopicsCard: StoryObj = {
  render: () => <TopTopicsCardSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Full TopTopics card skeleton with header.',
      },
    },
  },
}

export const TopicBadges: StoryObj = {
  render: () => <TopicBadgesSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Horizontal topic badges skeleton for compact displays.',
      },
    },
  },
}

// ============================================================================
// Message Skeletons
// ============================================================================

export const MessageCard: StoryObj = {
  render: () => <MessageCardSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Single message card skeleton matching MessageCard layout.',
      },
    },
  },
}

export const MessageFeed: StoryObj = {
  render: () => <MessageFeedSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Message feed skeleton with multiple cards.',
      },
    },
  },
}

export const MessageCompact: StoryObj = {
  render: () => <MessageCompactSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Compact message skeleton for smaller displays.',
      },
    },
  },
}

export const MessageCompactList: StoryObj = {
  render: () => <MessageCompactListSkeleton count={5} />,
  parameters: {
    docs: {
      description: {
        story: 'List of compact message skeletons.',
      },
    },
  },
}

// ============================================================================
// TodaysFocus Skeletons
// ============================================================================

export const FocusItem: StoryObj = {
  render: () => <FocusItemSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Single focus item skeleton.',
      },
    },
  },
}

export const TodaysFocus: StoryObj = {
  render: () => <TodaysFocusSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'TodaysFocus card skeleton with header and items.',
      },
    },
  },
}

export const ActionItem: StoryObj = {
  render: () => <ActionItemSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Action item skeleton for task-like items.',
      },
    },
  },
}

export const ActionList: StoryObj = {
  render: () => <ActionListSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'List of action item skeletons.',
      },
    },
  },
}

export const DailySummary: StoryObj = {
  render: () => <DailySummarySkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Daily summary card skeleton with stats and focus items.',
      },
    },
  },
}

// ============================================================================
// Combined Dashboard Layout
// ============================================================================

export const DashboardLayout: StoryObj = {
  render: () => (
    <div className="space-y-6">
      {/* Metrics row */}
      <MetricCardSkeletonGrid />

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Insights */}
        <TimelineInsightsSkeleton />

        {/* Right: Top Topics */}
        <TopTopicsCardSkeleton />
      </div>

      {/* Daily Summary */}
      <DailySummarySkeleton />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Combined dashboard layout showing all skeletons together.',
      },
    },
  },
}

// ============================================================================
// Messages Page Layout
// ============================================================================

export const MessagesPageLayout: StoryObj = {
  render: () => (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-10 w-32 rounded bg-muted animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-2">
        <div className="h-10 w-32 rounded bg-muted animate-pulse" />
        <div className="h-10 w-32 rounded bg-muted animate-pulse" />
        <div className="h-10 w-32 rounded bg-muted animate-pulse" />
      </div>

      {/* Message feed */}
      <MessageFeedSkeleton count={3} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Messages page layout with header, filters, and message feed skeletons.',
      },
    },
  },
}
