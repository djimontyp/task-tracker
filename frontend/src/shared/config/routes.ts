/**
 * Application route constants for better portability.
 * Use these instead of hard-coded strings throughout the app.
 */
export const ROUTES = {
  // Core
  home: '/',
  dashboard: '/dashboard',

  // Workspace
  messages: '/messages',
  atoms: '/atoms',
  topics: '/topics',
  topicDetail: (topicId: string) => `/topics/${topicId}`,
  executiveSummary: '/executive-summary',

  // AI Setup
  agents: '/agents',
  agentTasks: '/agent-tasks',
  projects: '/projects',

  // Monitoring
  performance: '/performance',

  // Settings
  settings: '/settings',

  // Dormant (hidden from UI)
  noiseFiltering: '/noise-filtering',
  automation: {
    dashboard: '/automation/dashboard',
    rules: '/automation/rules',
    scheduler: '/automation/scheduler',
  },
} as const;

/**
 * Type for route paths (for type-safe navigation)
 */
export type RoutePath = typeof ROUTES[keyof typeof ROUTES] extends string
  ? typeof ROUTES[keyof typeof ROUTES]
  : string;
