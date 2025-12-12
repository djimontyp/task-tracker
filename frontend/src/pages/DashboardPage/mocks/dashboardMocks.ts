/**
 * Dashboard Mock Data
 *
 * Factory functions for generating mock data during development.
 * Toggle USE_MOCK_DATA in useDashboardData.ts to switch to real API.
 */

import type {
  DashboardMetricsData,
  TrendsResponse,
  RecentInsight,
  TopTopic,
  AtomType,
  DashboardPeriod,
} from '../types'

// Simulates network delay for realistic loading states
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Mock metrics data
 */
export const createMockMetrics = (
  overrides?: Partial<DashboardMetricsData>
): DashboardMetricsData => ({
  critical: { count: 3, delta: 2 },
  ideas: { count: 7, delta: 5 },
  decisions: { count: 12, delta: -1 },
  questions: { count: 4, delta: 1 },
  ...overrides,
})

/**
 * Empty metrics for cold start state
 */
export const EMPTY_METRICS: DashboardMetricsData = {
  critical: { count: 0, delta: 0 },
  ideas: { count: 0, delta: 0 },
  decisions: { count: 0, delta: 0 },
  questions: { count: 0, delta: 0 },
}

/**
 * Mock trends data
 */
export const createMockTrends = (
  count = 5,
  period: DashboardPeriod = 'week'
): TrendsResponse => ({
  period,
  trends: [
    { keyword: 'API інтеграція', count: 15, delta: 8 },
    { keyword: 'Клієнт X', count: 8, delta: 2, relatedProblems: 2 },
    { keyword: 'Деплой п\'ятниця', count: 6, delta: 0 },
    { keyword: 'Рефакторинг auth', count: 5, delta: 3 },
    { keyword: 'Mobile redesign', count: 4, delta: -1 },
  ].slice(0, count),
})

/**
 * Empty trends for cold start
 */
export const EMPTY_TRENDS: TrendsResponse = {
  period: 'week',
  trends: [],
}

/**
 * Mock insights data (atoms)
 */
const INSIGHT_SAMPLES: Array<{
  type: AtomType
  title: string
  content: string
  author: string
  topicName: string
}> = [
  {
    type: 'PROBLEM',
    title: 'Баг авторизації на проді',
    content: 'Користувачі не можуть залогінитись через Google OAuth. Помилка 500 на callback endpoint.',
    author: 'petro',
    topicName: 'Mobile App Development',
  },
  {
    type: 'INSIGHT',
    title: 'Додати dark mode в налаштування',
    content: 'Багато користувачів просять темну тему, особливо для роботи ввечері.',
    author: 'maria',
    topicName: 'UI/UX',
  },
  {
    type: 'DECISION',
    title: 'Використовуємо PostgreSQL замість MongoDB',
    content: 'Прийнято рішення залишитись на PostgreSQL через pgvector та кращу підтримку транзакцій.',
    author: 'ivan',
    topicName: 'Backend API',
  },
  {
    type: 'SOLUTION',
    title: 'Оновити залежності до React 19',
    content: 'Потрібно оновити React та перевірити сумісність всіх бібліотек.',
    author: 'olena',
    topicName: 'Frontend',
  },
  {
    type: 'QUESTION',
    title: 'Який фреймворк для тестування обрати?',
    content: 'Vitest vs Jest - потрібно визначитись для нового проекту.',
    author: 'andriy',
    topicName: 'DevOps',
  },
]

const TOPIC_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
]

export const createMockInsights = (count = 5): RecentInsight[] => {
  const now = new Date()

  return INSIGHT_SAMPLES.slice(0, count).map((sample, index) => ({
    id: `insight-${index + 1}`,
    type: sample.type,
    title: sample.title,
    content: sample.content,
    author: sample.author,
    topicName: sample.topicName,
    topicId: `topic-${index + 1}`,
    topicColor: TOPIC_COLORS[index % TOPIC_COLORS.length],
    createdAt: new Date(now.getTime() - index * 3600000).toISOString(), // 1 hour apart
    importance: 0.85 - index * 0.05,
  }))
}

/**
 * Empty insights for cold start
 */
export const EMPTY_INSIGHTS: RecentInsight[] = []

/**
 * Mock topics data
 */
export const createMockTopics = (count = 5): TopTopic[] => {
  const topics: TopTopic[] = [
    {
      id: 'topic-1',
      name: 'Mobile App Development',
      icon: 'Smartphone',
      color: '#3B82F6',
      atomCount: 23,
      messageCount: 156,
    },
    {
      id: 'topic-2',
      name: 'Backend API',
      icon: 'Server',
      color: '#10B981',
      atomCount: 18,
      messageCount: 98,
    },
    {
      id: 'topic-3',
      name: 'DevOps',
      icon: 'Container',
      color: '#F59E0B',
      atomCount: 12,
      messageCount: 67,
    },
    {
      id: 'topic-4',
      name: 'UI/UX',
      icon: 'Palette',
      color: '#8B5CF6',
      atomCount: 9,
      messageCount: 45,
    },
    {
      id: 'topic-5',
      name: 'Security',
      icon: 'Shield',
      color: '#EF4444',
      atomCount: 7,
      messageCount: 34,
    },
  ]

  return topics.slice(0, count)
}

/**
 * Empty topics for cold start
 */
export const EMPTY_TOPICS: TopTopic[] = []

/**
 * Check if dashboard has no data (cold start)
 */
export const isEmptyDashboard = (metrics: DashboardMetricsData): boolean => {
  return (
    metrics.critical.count === 0 &&
    metrics.ideas.count === 0 &&
    metrics.decisions.count === 0
  )
}
