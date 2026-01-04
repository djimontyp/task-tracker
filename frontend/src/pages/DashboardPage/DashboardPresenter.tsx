/**
 * Dashboard Presenter (Container/Presenter pattern)
 *
 * Pure presentational component - receives all data as props.
 * No data fetching, no side effects, easy to test in Storybook.
 */

import { OnboardingWizard, SetupWizard } from '@/features/onboarding'
import { PageWrapper } from '@/shared/primitives'

import {
  DashboardMetrics,
  CommandCenter,
  RecentInsights,
  TopTopics,
  TodaysFocus,
} from './components'
import type { DashboardPresenterProps } from './types'

/**
 * DashboardPresenter - Pure UI component
 *
 * Renders the dashboard layout with all data passed as props.
 * Container (index.tsx) handles data fetching and state management.
 */
export function DashboardPresenter({
  metrics,
  insights,
  topics,
  focusAtoms,
  trendData,
  trendLoading,
  activityData,
  activityLoading,
  hasNoData,
  isAnyLoading,
  showOnboarding,
  greeting,
  subtitle,
  onCloseOnboarding,
  onNavigateToSettings,
  onNavigateToMessages: _onNavigateToMessages,
  onNavigateToTopics,
  onNavigateToProjects,
  onNavigateToAgents,
}: DashboardPresenterProps) {
  // Note: _onNavigateToMessages reserved for future use (e.g., empty state actions)
  void _onNavigateToMessages;

  return (
    <PageWrapper variant="fullWidth">
      <OnboardingWizard open={showOnboarding} onClose={onCloseOnboarding} />

      {/* Cold Start Empty State - SetupWizard */}
      {hasNoData && !isAnyLoading && (
        <SetupWizard
          step2Status="locked"
          step3Status="locked"
          step4Status="locked"
          onConnectSource={onNavigateToSettings}
          onCreateProject={onNavigateToProjects}
          onActivateAgent={onNavigateToAgents}
        />
      )}

      {/* Hero Section - Command Center (Unified HUD) */}
      <CommandCenter
        greeting={greeting}
        subtitle={subtitle}
        trendData={trendData}
        trendLoading={trendLoading}
        activityData={activityData}
        activityLoading={activityLoading}
      />

      {/* Row 1: Metrics (3 cards) */}
      <div
        className="animate-fade-in-up"
        style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}
      >
        <DashboardMetrics
          data={metrics.data}
          isLoading={metrics.isLoading}
          error={metrics.error}
        />
      </div>

      {/* Row 2: Focus | Topics (side by side) */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up"
        style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
      >
        <TodaysFocus
          atoms={focusAtoms.data ?? []}
          isLoading={focusAtoms.isLoading}
        />
        <TopTopics
          data={topics.data}
          isLoading={topics.isLoading}
          error={topics.error}
          limit={5}
        />
      </div>

      {/* Row 3: Recent Insights (full width) */}
      <div
        className="animate-fade-in-up"
        style={{ animationDelay: '0.35s', animationFillMode: 'backwards' }}
      >
        <RecentInsights
          data={insights.data}
          isLoading={insights.isLoading}
          error={insights.error}
          onViewAll={onNavigateToTopics}
        />
      </div>
    </PageWrapper>
  )
}

export default DashboardPresenter
