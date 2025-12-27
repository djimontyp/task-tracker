import { useMemo } from 'react'

export interface BreadcrumbSegment {
  label: string
  href?: string
}

export interface BreadcrumbConfig {
  crumbs: BreadcrumbSegment[]
  tooltip: string
}

interface RouteConfig {
  crumbs: BreadcrumbSegment[]
  tooltip: string
}

/**
 * Dynamic label overrides for routes with parameters.
 * Key format: 'routePattern:paramId' (e.g., 'topics:abc-123')
 */
export interface DynamicLabels {
  /** Label for topic detail page (e.g., topic name) */
  topicName?: string
}

const breadcrumbMap: Record<string, RouteConfig> = {
  '/': {
    crumbs: [{ label: 'Dashboard' }],
    tooltip: 'Огляд ключових метрик, трендів та останніх інсайтів з ваших каналів',
  },
  '/messages': {
    crumbs: [{ label: 'Messages' }],
    tooltip: 'Повідомлення з підключених каналів — фільтруйте, шукайте, аналізуйте',
  },
  '/topics': {
    crumbs: [{ label: 'Topics' }],
    tooltip: 'Теми для організації знань — налаштуйте іконки, кольори та ключові слова',
  },
  '/tasks': {
    crumbs: [{ label: 'Tasks' }],
    tooltip: 'Завдання для аналізу та обробки повідомлень',
  },
  '/analysis': {
    crumbs: [{ label: 'Analysis Runs' }],
    tooltip: 'Запуски AI-аналізу — статус, результати та історія',
  },
  '/proposals': {
    crumbs: [{ label: 'Task Proposals' }],
    tooltip: 'Пропозиції від AI — переглядайте та схвалюйте',
  },
  '/noise-filtering': {
    crumbs: [{ label: 'Noise Filtering' }],
    tooltip: 'Статистика фільтрації шуму — скільки сигналу vs шуму у ваших даних',
  },
  '/versions': {
    crumbs: [{ label: 'Versions' }],
    tooltip: 'Версії атомів знань — переглядайте зміни та схвалюйте оновлення',
  },
  '/agents': {
    crumbs: [{ label: 'Agents' }],
    tooltip: 'AI-агенти для автоматичної класифікації та аналізу повідомлень',
  },
  '/agent-tasks': {
    crumbs: [{ label: 'Task Templates' }],
    tooltip: 'Шаблони завдань для агентів — визначте що і як аналізувати',
  },
  '/providers': {
    crumbs: [{ label: 'Providers' }],
    tooltip: 'LLM провайдери — налаштуйте OpenAI, Ollama та інші',
  },
  '/projects': {
    crumbs: [{ label: 'Projects' }],
    tooltip: 'Проекти групують теми — налаштуйте фільтри по ключовим словам',
  },
  '/automation/dashboard': {
    crumbs: [
      { label: 'Automation', href: '/automation/dashboard' },
      { label: 'Overview' },
    ],
    tooltip: 'Огляд автоматизації — правила, розклад та нотифікації',
  },
  '/automation/rules': {
    crumbs: [
      { label: 'Automation', href: '/automation/dashboard' },
      { label: 'Rules' },
    ],
    tooltip: 'Правила автоматичної обробки повідомлень',
  },
  '/automation/scheduler': {
    crumbs: [
      { label: 'Automation', href: '/automation/dashboard' },
      { label: 'Scheduler' },
    ],
    tooltip: 'Розклад автоматичних задач',
  },
  '/automation/notifications': {
    crumbs: [
      { label: 'Automation', href: '/automation/dashboard' },
      { label: 'Notifications' },
    ],
    tooltip: 'Налаштування сповіщень автоматизації',
  },
  '/monitoring': {
    crumbs: [{ label: 'Task Monitoring' }],
    tooltip: 'Моніторинг виконання задач у реальному часі',
  },
  '/settings': {
    crumbs: [{ label: 'Settings' }],
    tooltip: 'Налаштування Telegram-інтеграції та інших джерел даних',
  },
}

const DEFAULT_TOOLTIP = 'Інформація про цю сторінку'
const TOPIC_DETAIL_TOOLTIP = 'Детальний перегляд теми: пов\'язані повідомлення, атоми знань та історія'

/**
 * Generates breadcrumb configuration based on the current pathname.
 *
 * This hook is pure and does not fetch any data - dynamic labels must be
 * provided by the caller. This keeps the shared layer independent from
 * feature-specific API services.
 *
 * @param pathname - Current route pathname
 * @param dynamicLabels - Optional labels for dynamic routes (e.g., topic name)
 */
export function useBreadcrumbs(
  pathname: string,
  dynamicLabels?: DynamicLabels
): BreadcrumbConfig {
  const topicDetailMatch = pathname.match(/^\/topics\/([a-f0-9-]+)$/)
  const topicIdFromUrl = topicDetailMatch ? topicDetailMatch[1] : null

  const config = useMemo((): BreadcrumbConfig => {
    if (topicDetailMatch && topicIdFromUrl) {
      return {
        crumbs: [
          { label: 'Topics', href: '/topics' },
          { label: dynamicLabels?.topicName || 'Topic' },
        ],
        tooltip: TOPIC_DETAIL_TOOLTIP,
      }
    }

    const routeConfig = breadcrumbMap[pathname]

    if (!routeConfig) {
      return {
        crumbs: pathname
          .split('/')
          .filter(Boolean)
          .map((segment) => ({
            label: segment.charAt(0).toUpperCase() + segment.replace(/-/g, ' ').slice(1),
          })),
        tooltip: DEFAULT_TOOLTIP,
      }
    }

    return routeConfig
  }, [pathname, topicDetailMatch, topicIdFromUrl, dynamicLabels?.topicName])

  return config
}
