/**
 * Dashboard Presenter (Container/Presenter pattern)
 *
 * Pure presentational component - receives all data as props.
 * No data fetching, no side effects, easy to test in Storybook.
 */

import { useTranslation } from 'react-i18next'
import { Inbox, Settings } from 'lucide-react'
import { OnboardingWizard } from '@/features/onboarding'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
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
  onNavigateToMessages,
  onNavigateToTopics,
}: DashboardPresenterProps) {
  const { t } = useTranslation('dashboard')

  return (
    <PageWrapper variant="fullWidth">
      <OnboardingWizard open={showOnboarding} onClose={onCloseOnboarding} />

      {/* Cold Start Empty State */}
      {hasNoData && !isAnyLoading && (
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Inbox className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t('coldStart.title')}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t('coldStart.description')}
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <Button onClick={onNavigateToSettings} size="lg">
                <Settings className="mr-2 h-5 w-5" aria-hidden="true" />
                {t('coldStart.setupTelegram')}
              </Button>
              <Button onClick={onNavigateToMessages} variant="outline" size="lg">
                {t('coldStart.viewMessages')}
              </Button>
            </div>
          </CardContent>
        </Card>
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
