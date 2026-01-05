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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useDashboardData, useMessageTrends, useActivityHeatmap } from './hooks/useDashboardData'
import { DashboardPresenter } from './DashboardPresenter'
import type { FocusAtom } from './types'
import type { StepStatus } from '@/features/onboarding/types/wizard'
import type { CreateProjectConfig } from '@/features/projects/types'
import { projectService } from '@/features/projects/api/projectService'
import { agentService } from '@/features/agents/api/agentService'
import { atomService } from '@/features/atoms/api/atomService'
import { useTelegramStore } from '@/pages/SettingsPage/plugins/TelegramSource/useTelegramStore'
import { useServiceStatus } from '@/shared/hooks'

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
  pendingCount: number,
  connectionStatus: string
): string {
  const { t } = useTranslation(['dashboard'])

  return useMemo(() => {
    if (isLoading) {
      return t('subtitle.loading', 'Аналізую дані...')
    }

    if (hasNoData) {
      if (connectionStatus === 'connected') {
        return t('subtitle.listening', 'Слухаємо ефір... Збираємо перші дані.')
      }
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
  }, [t, hasNoData, isLoading, criticalCount, pendingCount, connectionStatus])
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
  const [projectFormOpen, setProjectFormOpen] = useState(false)
  const queryClient = useQueryClient()

  // Determine date locale
  const dateLocale = i18n.language === 'uk' ? uk : enUS

  // Service status for Pulse indicator
  const { indicator: serviceConnectionStatus } = useServiceStatus()

  // Wizard step data queries
  const { connectionStatus } = useTelegramStore()
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.listProjects(),
  })
  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentService.listAgents(),
  })
  const { data: atomsData } = useQuery({
    queryKey: ['atoms', 'count'],
    queryFn: () => atomService.listAtoms(0, 1), // limit=1, only need total
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // ProjectForm mutation
  const createProjectMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setProjectFormOpen(false)
      toast.success('Project created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create project: ${error.message}`)
    },
  })

  // Data fetching
  const { metrics, insights, topics, hasNoData, isAnyLoading } =
    useDashboardData('today')

  // Chart data fetching
  const { data: trendData, isLoading: trendLoading } = useMessageTrends(30, dateLocale)
  const { data: activityData, isLoading: activityLoading } = useActivityHeatmap() // Uses default '6months'

  // Computed greeting and subtitle
  const greeting = useGreeting()
  const criticalCount = metrics.data?.critical?.count ?? 0
  const pendingCount = insights.data?.filter((i) => i.importance && i.importance >= 0.7).length ?? 0
  const subtitle = useHeroSubtitle(hasNoData, isAnyLoading, criticalCount, pendingCount, connectionStatus)

  // Compute wizard step statuses
  const step1Completed = connectionStatus === 'connected' || connectionStatus === 'warning'
  const hasProjects = (projectsData?.items?.length ?? 0) > 0
  const hasActiveAgent = agentsData && agentsData.length > 0 && agentsData.some((a) => a.is_active)
  const hasAtoms = (atomsData?.total ?? 0) > 0

  const step2Status: StepStatus = useMemo(() => {
    if (!step1Completed) return 'locked'
    return hasProjects ? 'completed' : 'active'
  }, [step1Completed, hasProjects])

  const step3Status: StepStatus = useMemo(() => {
    if (step2Status !== 'completed') return 'locked'
    return hasActiveAgent ? 'completed' : 'active'
  }, [step2Status, hasActiveAgent])

  const step4Status: StepStatus = useMemo(() => {
    if (step3Status !== 'completed') return 'locked'
    return hasAtoms ? 'completed' : 'pending'
  }, [step3Status, hasAtoms])

  // Wizard is "visually completed" when user finishes all manual steps (1-3).
  // Step 4 is passive waiting, so we show the "Analyzing..." banner.
  const isWizardCompleted = step3Status === 'completed'

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

  const handleNavigateToProjects = useCallback(() => {
    navigate('/projects')
  }, [navigate])

  const handleNavigateToAgents = useCallback(() => {
    navigate('/agents')
  }, [navigate])

  // ProjectForm callbacks
  const handleOpenProjectForm = useCallback(() => {
    setProjectFormOpen(true)
  }, [])

  const handleCloseProjectForm = useCallback(() => {
    setProjectFormOpen(false)
  }, [])

  const handleProjectSubmit = useCallback(
    async (data: CreateProjectConfig) => {
      await createProjectMutation.mutateAsync(data)
    },
    [createProjectMutation]
  )

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
      onNavigateToProjects={handleNavigateToProjects}
      onNavigateToAgents={handleNavigateToAgents}
      step2Status={step2Status}
      step3Status={step3Status}
      step4Status={step4Status}
      isWizardCompleted={isWizardCompleted}
      projectFormOpen={projectFormOpen}
      onProjectFormClose={handleCloseProjectForm}
      onProjectSubmit={handleProjectSubmit}
      projectFormLoading={createProjectMutation.isPending}
      onCreateProject={handleOpenProjectForm}
      connectionStatus={serviceConnectionStatus}
    />
  )
}

export default DashboardPage
