import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPresenter } from './DashboardPresenter'
import type { DashboardPresenterProps } from './types'

// Mock OnboardingWizard
vi.mock('@/features/onboarding', () => ({
  OnboardingWizard: ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    if (!open) return null
    return (
      <div data-testid="onboarding-wizard">
        <button onClick={onClose} data-testid="close-onboarding-btn">X</button>
      </div>
    )
  },
}))

// Mock child components for isolation
// Using simple markers to avoid i18n rule violations (test mocks don't need translation)
vi.mock('./components', () => ({
  DashboardMetrics: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="dashboard-metrics">{isLoading ? '[loading:metrics]' : '[loaded:metrics]'}</div>
  ),
  ActivityHeatmap: () => <div data-testid="activity-heatmap" />,
  TrendChart: () => <div data-testid="trend-chart" />,
  RecentInsights: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="recent-insights">{isLoading ? '[loading:insights]' : '[loaded:insights]'}</div>
  ),
  TopTopics: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="top-topics">{isLoading ? '[loading:topics]' : '[loaded:topics]'}</div>
  ),
  TodaysFocus: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="todays-focus">{isLoading ? '[loading:focus]' : '[loaded:focus]'}</div>
  ),
}))

// Test wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('DashboardPresenter', () => {
  const mockCallbacks = {
    onCloseOnboarding: vi.fn(),
    onNavigateToSettings: vi.fn(),
    onNavigateToMessages: vi.fn(),
    onNavigateToTopics: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Factory for loading state props
  const createLoadingProps = (): DashboardPresenterProps => ({
    metrics: { data: undefined, isLoading: true, error: null },
    insights: { data: undefined, isLoading: true, error: null },
    topics: { data: undefined, isLoading: true, error: null },
    focusAtoms: { data: undefined, isLoading: true, error: null },
    hasNoData: false,
    isAnyLoading: true,
    showOnboarding: false,
    greeting: 'Добрий ранок, Макс!',
    subtitle: 'Завантаження...',
    ...mockCallbacks,
  })

  // Factory for loaded state props
  const createLoadedProps = (): DashboardPresenterProps => ({
    metrics: {
      data: {
        critical: { count: 5, delta: 2 },
        ideas: { count: 10, delta: -1 },
        decisions: { count: 3, delta: 0 },
        questions: { count: 7, delta: 3 },
      },
      isLoading: false,
      error: null,
    },
    insights: {
      data: [
        {
          id: '1',
          type: 'PROBLEM',
          title: 'Test Insight',
          author: 'User',
          topicName: 'Topic',
          topicId: 'topic-1',
          createdAt: new Date().toISOString(),
          importance: 0.8,
        },
      ],
      isLoading: false,
      error: null,
    },
    topics: {
      data: [
        {
          id: '1',
          name: 'Topic 1',
          icon: 'Folder',
          color: '#FF0000',
          atomCount: 15,
          messageCount: 50,
        },
      ],
      isLoading: false,
      error: null,
    },
    focusAtoms: {
      data: [
        { id: 1, title: 'Review API', atom_type: 'TASK', created_at: new Date().toISOString() },
      ],
      isLoading: false,
      error: null,
    },
    hasNoData: false,
    isAnyLoading: false,
    showOnboarding: false,
    greeting: 'Добрий ранок, Макс!',
    subtitle: '5 сигналів потребують уваги',
    ...mockCallbacks,
  })

  // Factory for empty state props
  const createEmptyProps = (): DashboardPresenterProps => ({
    metrics: { data: undefined, isLoading: false, error: null },
    insights: { data: undefined, isLoading: false, error: null },
    topics: { data: undefined, isLoading: false, error: null },
    focusAtoms: { data: undefined, isLoading: false, error: null },
    hasNoData: true,
    isAnyLoading: false,
    showOnboarding: false,
    greeting: 'Добрий ранок, Макс!',
    subtitle: 'Немає даних',
    ...mockCallbacks,
  })

  // ========== RENDERING TESTS ==========

  describe('Rendering', () => {
    test('renders greeting and subtitle', () => {
      render(<DashboardPresenter {...createLoadingProps()} />, { wrapper: createWrapper() })

      expect(screen.getByText('Добрий ранок, Макс!')).toBeInTheDocument()
      expect(screen.getByText('Завантаження...')).toBeInTheDocument()
    })

    test('renders settings button', () => {
      render(<DashboardPresenter {...createLoadingProps()} />, { wrapper: createWrapper() })

      expect(screen.getByRole('button', { name: /налаштування/i })).toBeInTheDocument()
    })

    test('renders all dashboard sections', () => {
      render(<DashboardPresenter {...createLoadingProps()} />, { wrapper: createWrapper() })

      expect(screen.getByTestId('dashboard-metrics')).toBeInTheDocument()
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument()
      expect(screen.getByTestId('recent-insights')).toBeInTheDocument()
      expect(screen.getByTestId('todays-focus')).toBeInTheDocument()
      expect(screen.getByTestId('activity-heatmap')).toBeInTheDocument()
      expect(screen.getByTestId('top-topics')).toBeInTheDocument()
    })
  })

  // ========== LOADING STATE ==========

  describe('Loading State', () => {
    test('shows loading indicators when data is loading', () => {
      render(<DashboardPresenter {...createLoadingProps()} />, { wrapper: createWrapper() })

      expect(screen.getByText('[loading:metrics]')).toBeInTheDocument()
      expect(screen.getByText('[loading:insights]')).toBeInTheDocument()
      expect(screen.getByText('[loading:topics]')).toBeInTheDocument()
      expect(screen.getByText('[loading:focus]')).toBeInTheDocument()
    })
  })

  // ========== DATA LOADED STATE ==========

  describe('Data Loaded State', () => {
    test('renders with loaded data', () => {
      render(<DashboardPresenter {...createLoadedProps()} />, { wrapper: createWrapper() })

      expect(screen.getByText('5 сигналів потребують уваги')).toBeInTheDocument()
      expect(screen.getByText('[loaded:metrics]')).toBeInTheDocument()
      expect(screen.getByText('[loaded:insights]')).toBeInTheDocument()
    })

    test('does not show empty state when data exists', () => {
      render(<DashboardPresenter {...createLoadedProps()} />, { wrapper: createWrapper() })

      expect(screen.queryByText('Почніть збирати знання')).not.toBeInTheDocument()
    })
  })

  // ========== EMPTY STATE ==========

  describe('Empty State', () => {
    test('shows empty state when hasNoData=true', () => {
      render(<DashboardPresenter {...createEmptyProps()} />, { wrapper: createWrapper() })

      expect(screen.getByText('Почніть збирати знання')).toBeInTheDocument()
      expect(screen.getByText(/підключіть telegram/i)).toBeInTheDocument()
    })

    test('shows action buttons in empty state', () => {
      render(<DashboardPresenter {...createEmptyProps()} />, { wrapper: createWrapper() })

      expect(screen.getByRole('button', { name: /налаштувати telegram/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /переглянути повідомлення/i })).toBeInTheDocument()
    })

    test('does not show empty state when loading', () => {
      const props = { ...createEmptyProps(), isAnyLoading: true }
      render(<DashboardPresenter {...props} />, { wrapper: createWrapper() })

      expect(screen.queryByText('Почніть збирати знання')).not.toBeInTheDocument()
    })
  })

  // ========== ONBOARDING STATE ==========

  describe('Onboarding State', () => {
    test('shows onboarding wizard when showOnboarding=true', () => {
      const props = { ...createLoadingProps(), showOnboarding: true }
      render(<DashboardPresenter {...props} />, { wrapper: createWrapper() })

      expect(screen.getByTestId('onboarding-wizard')).toBeInTheDocument()
    })

    test('does not show onboarding when showOnboarding=false', () => {
      render(<DashboardPresenter {...createLoadingProps()} />, { wrapper: createWrapper() })

      expect(screen.queryByTestId('onboarding-wizard')).not.toBeInTheDocument()
    })

    test('calls onCloseOnboarding when wizard is closed', async () => {
      const user = userEvent.setup()
      const props = { ...createLoadingProps(), showOnboarding: true }
      render(<DashboardPresenter {...props} />, { wrapper: createWrapper() })

      await user.click(screen.getByTestId('close-onboarding-btn'))

      expect(mockCallbacks.onCloseOnboarding).toHaveBeenCalledTimes(1)
    })
  })

  // ========== NAVIGATION CALLBACKS ==========

  describe('Navigation Callbacks', () => {
    test('calls onNavigateToSettings when settings button clicked', async () => {
      const user = userEvent.setup()
      render(<DashboardPresenter {...createLoadingProps()} />, { wrapper: createWrapper() })

      await user.click(screen.getByRole('button', { name: /налаштування/i }))

      expect(mockCallbacks.onNavigateToSettings).toHaveBeenCalledTimes(1)
    })

    test('calls onNavigateToSettings from empty state', async () => {
      const user = userEvent.setup()
      render(<DashboardPresenter {...createEmptyProps()} />, { wrapper: createWrapper() })

      await user.click(screen.getByRole('button', { name: /налаштувати telegram/i }))

      expect(mockCallbacks.onNavigateToSettings).toHaveBeenCalledTimes(1)
    })

    test('calls onNavigateToMessages from empty state', async () => {
      const user = userEvent.setup()
      render(<DashboardPresenter {...createEmptyProps()} />, { wrapper: createWrapper() })

      await user.click(screen.getByRole('button', { name: /переглянути повідомлення/i }))

      expect(mockCallbacks.onNavigateToMessages).toHaveBeenCalledTimes(1)
    })
  })
})
