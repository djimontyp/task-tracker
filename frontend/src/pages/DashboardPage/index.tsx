/**
 * Dashboard Page
 *
 * CEO/PM overview: metrics, trends, recent insights, activity heatmap, top topics.
 * Uses mock data initially, toggle USE_MOCK_DATA in useDashboardData.ts for real API.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Inbox, Settings } from 'lucide-react'
import { OnboardingWizard } from '@/features/onboarding'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'

import { PageWrapper } from '@/shared/primitives'
import { useDashboardData } from './hooks/useDashboardData'
import {
  DashboardMetrics,
  ActivityHeatmap,
  TrendChart,
  // TrendsList, // Hidden until /api/v1/dashboard/trends endpoint is implemented
  RecentInsights,
  TopTopics,
} from './components'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['dashboard', 'common'])
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Note: trends hook still called but not rendered - remove from useDashboardData when cleaning up
  const { metrics, insights, topics, hasNoData, isAnyLoading } =
    useDashboardData('today')

  // Show onboarding wizard for new users
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed')
    const hasSkippedOnboarding = localStorage.getItem('onboarding_skipped')

    if (!hasCompletedOnboarding && !hasSkippedOnboarding && !isAnyLoading) {
      if (hasNoData) {
        setShowOnboarding(true)
      }
    }
  }, [isAnyLoading, hasNoData])

  return (
    <PageWrapper variant="fullWidth">
      <OnboardingWizard
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {/* Cold Start Empty State */}
      {hasNoData && !isAnyLoading && (
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Inbox className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Почніть збирати знання
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Підключіть Telegram, щоб AI почав аналізувати повідомлення та
              витягувати важливу інформацію
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <Button onClick={() => navigate('/settings')} size="lg">
                <Settings className="mr-2 h-5 w-5" aria-hidden="true" />
                Налаштувати Telegram
              </Button>
              <Button
                onClick={() => navigate('/messages')}
                variant="outline"
                size="lg"
              >
                Переглянути повідомлення
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {(() => {
              const hour = new Date().getHours()
              if (hour < 12) return t('greeting.morning')
              if (hour < 18) return t('greeting.afternoon')
              return t('greeting.evening')
            })()}, Макс! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Ось що відбувається у вашому проєкті сьогодні.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            Налаштування
          </Button>
        </div>
      </div>

      {/* Row 1: Metrics (3 cards) */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
        <DashboardMetrics
          data={metrics.data}
          isLoading={metrics.isLoading}
          error={metrics.error}
        />
      </div>

      {/* Row 2: Trends Chart */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
        <TrendChart />
      </div>

      {/* Row 2: Recent Insights */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
        <RecentInsights
          data={insights.data}
          isLoading={insights.isLoading}
          error={insights.error}
          onViewAll={() => navigate('/topics')}
        />
      </div>

      {/* Row 4: Activity Heatmap + Top Topics (2 columns on desktop) */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up"
        style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}
      >
        <ActivityHeatmap />
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

export default DashboardPage
