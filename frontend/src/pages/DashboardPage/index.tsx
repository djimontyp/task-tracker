/**
 * Dashboard Page Container (Container/Presenter pattern)
 *
 * Container component - handles data fetching, state management, and navigation.
 * Delegates rendering to DashboardPresenter (pure component).
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { uk, enUS } from 'date-fns/locale'

import { useDashboardData, useMessageTrends, useActivityHeatmap } from './hooks/useDashboardData'
import { DashboardPresenter } from './DashboardPresenter'
import type { FocusAtom } from './types'

// Mock data for focusAtoms until API endpoint is ready
// TODO: Replace with useQuery for GET /api/v1/atoms?status=pending_review&limit=3
const mockFocusAtoms: FocusAtom[] = [
  { id: 1, title: 'Review API rate limits', atom_type: 'TASK', created_at: new Date().toISOString() },
  { id: 2, title: 'Add dark mode toggle', atom_type: 'IDEA', created_at: new Date().toISOString() },
  { id: 3, title: 'What triggers the webhook?', atom_type: 'QUESTION', created_at: new Date().toISOString() },
]

/**
 * Compute greeting based on current hour
 */
function useGreeting(): string {
  const { t } = useTranslation(['dashboard'])

  return useMemo(() => {
    const hour = new Date().getHours()
    let greetingKey: string
    if (hour < 12) {
      greetingKey = 'greeting.morning'
    } else if (hour < 18) {
      greetingKey = 'greeting.afternoon'
    } else {
      greetingKey = 'greeting.evening'
    }
    return `${t(greetingKey)}, Макс!`
  }, [t])
}

/**
 * Compute dynamic hero subtitle based on data state
 */
function useHeroSubtitle(
  hasNoData: boolean,
  isLoading: boolean,
  criticalCount: number,
  pendingCount: number
): string {
  const { t } = useTranslation(['dashboard'])

  return useMemo(() => {
    if (isLoading) {
      return t('subtitle.loading', 'Аналізую дані...')
    }

    if (hasNoData) {
      return t('subtitle.empty', 'Тиша в ефірі ☕️ Підключіть джерела даних.')
    }

    if (criticalCount > 0) {
      return t('subtitle.attention', {
        count: criticalCount,
        defaultValue: `Є ${criticalCount} сигналів що потребують уваги`,
      })
    }

    if (pendingCount > 0) {
      return t('subtitle.pending', {
        count: pendingCount,
        defaultValue: `${pendingCount} інсайтів очікують на розгляд`,
      })
    }

    return t('subtitle.stable', 'Проєкт рухається стабільно 🚀')
  }, [t, hasNoData, isLoading, criticalCount, pendingCount])
}

/**
 * DashboardPage - Container component
 *
 * Responsibilities:
 * - Data fetching via useDashboardData hook
 * - Onboarding state management
 * - Navigation callbacks
 * - Passes all data to DashboardPresenter
 */
const DashboardPage = () => {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Determine date locale
  const dateLocale = i18n.language === 'uk' ? uk : enUS

  // Data fetching
  const { metrics, insights, topics, hasNoData, isAnyLoading } =
    useDashboardData('today')

  // Chart data fetching
  const { data: trendData, isLoading: trendLoading } = useMessageTrends(30, dateLocale)
  const { data: activityData, isLoading: activityLoading } = useActivityHeatmap('week')

  // Computed greeting and subtitle
  const greeting = useGreeting()
  const criticalCount = metrics.data?.critical?.count ?? 0
  const pendingCount = insights.data?.filter((i) => i.importance && i.importance >= 0.7).length ?? 0
  const subtitle = useHeroSubtitle(hasNoData, isAnyLoading, criticalCount, pendingCount)

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

  // Navigation callbacks (memoized to prevent unnecessary re-renders)
  const handleCloseOnboarding = useCallback(() => {
    setShowOnboarding(false)
  }, [])

  const handleNavigateToSettings = useCallback(() => {
    navigate('/settings')
  }, [navigate])

  const handleNavigateToMessages = useCallback(() => {
    navigate('/messages')
  }, [navigate])

  const handleNavigateToTopics = useCallback(() => {
    navigate('/topics')
  }, [navigate])

  return (
    <DashboardPresenter
      metrics={{
        data: metrics.data,
        isLoading: metrics.isLoading,
        error: metrics.error,
      }}
      insights={{
        data: insights.data,
        isLoading: insights.isLoading,
        error: insights.error,
      }}
      topics={{
        data: topics.data,
        isLoading: topics.isLoading,
        error: topics.error,
      }}
      focusAtoms={{
        data: mockFocusAtoms,
        isLoading: false,
        error: null,
      }}
      trendData={trendData}
      trendLoading={trendLoading}
      activityData={activityData}
      activityLoading={activityLoading}
      hasNoData={hasNoData}
      isAnyLoading={isAnyLoading}
      showOnboarding={showOnboarding}
      greeting={greeting}
      subtitle={subtitle}
      onCloseOnboarding={handleCloseOnboarding}
      onNavigateToSettings={handleNavigateToSettings}
      onNavigateToMessages={handleNavigateToMessages}
      onNavigateToTopics={handleNavigateToTopics}
    />
  )
}

export default DashboardPage
