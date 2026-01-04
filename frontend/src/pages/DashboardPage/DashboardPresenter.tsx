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
import { ZoomableCard } from '@/shared/ui/zoomable-card'
import { PageWrapper } from '@/shared/primitives'

import {
  DashboardMetrics,
  ActivityHeatmap,
  TrendChart,
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

      {/* Hero Section - Compact Flex Row */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8 h-auto lg:h-28 animate-fade-in-up">
        {/* Greeting (Auto width) - Only takes necessary space */}
        <div className="flex flex-col justify-center shrink-0 min-w-0 max-w-full lg:max-w-[40%]">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight truncate" title={greeting}>
            {greeting}
          </h1>
          <p className="text-muted-foreground mt-1 truncate" title={subtitle}>
            {subtitle}
          </p>
        </div>

        {/* Charts (Fill remaining space 50/50) */}
        <div className="flex-1 grid grid-cols-2 gap-4 min-w-0 h-28 lg:h-full">
          {/* Compact Trend Chart */}
          <ZoomableCard
            trigger="hover"
            className="h-full min-w-0"
            preview={<TrendChart compact />}
            full={
              <div className="h-[350px] w-full p-4">
                <TrendChart />
              </div>
            }
          />

          {/* Compact Heatmap */}
          <ZoomableCard
            trigger="hover"
            className="h-full min-w-0"
            preview={<ActivityHeatmap compact />}
            full={
              <div className="h-[350px] w-full p-4 flex flex-col justify-center">
                <ActivityHeatmap />
              </div>
            }
          />
        </div>
      </div>

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

      {/* Row 2: Recent Insights */}
      <div
        className="animate-fade-in-up"
        style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
      >
        <RecentInsights
          data={insights.data}
          isLoading={insights.isLoading}
          error={insights.error}
          onViewAll={onNavigateToTopics}
        />
      </div>

      {/* Row 3.5: Today's Focus (pending review atoms) */}
      <div
        className="animate-fade-in-up"
        style={{ animationDelay: '0.35s', animationFillMode: 'backwards' }}
      >
        <TodaysFocus
          atoms={focusAtoms.data ?? []}
          isLoading={focusAtoms.isLoading}
        />
      </div>

      {/* Row 4: Top Topics */}
      <div
        className="animate-fade-in-up"
        style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}
      >
        <TopTopics
          data={topics.data}
          isLoading={topics.isLoading}
          error={topics.error}
          limit={5}
        />
      </div>
    </PageWrapper>
  )
}

export default DashboardPresenter
