/**
 * API Configuration
 *
 * Centralized API configuration for versioning and base URL management.
 */

export const API_VERSION = 'v1'
export const API_BASE_PATH = `/api/${API_VERSION}`

/**
 * Helper function to build API endpoint paths
 */
export function buildApiPath(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${API_BASE_PATH}/${cleanEndpoint}`
}

/**
 * Common API endpoints
 */
export const API_ENDPOINTS = {
  // Health & Config
  health: buildApiPath('health'),
  config: buildApiPath('config'),

  // Messages
  messages: buildApiPath('messages'),
  updateAuthors: (chatId: string) => buildApiPath(`messages/update-authors?chat_id=${chatId}`),

  // Tasks (TaskEntity - analysis results)
  tasks: buildApiPath('tasks'),

  // Task Configs (Pydantic schemas for agents)
  taskConfigs: buildApiPath('task-configs'),

  // Statistics
  stats: buildApiPath('stats'),
  activity: buildApiPath('activity'),
  sidebarCounts: buildApiPath('sidebar-counts'),

  // Webhook Settings
  webhookSettings: buildApiPath('webhook-settings'),
  telegramWebhook: {
    set: buildApiPath('webhook-settings/telegram/set'),
    delete: buildApiPath('webhook-settings/telegram'),
    groups: buildApiPath('webhook-settings/telegram/groups'),
    group: (groupId: string | number) => buildApiPath(`webhook-settings/telegram/groups/${groupId}`),
    refreshNames: buildApiPath('webhook-settings/telegram/groups/refresh-names'),
  },

  // Ingestion
  ingestion: {
    telegram: buildApiPath('ingestion/telegram'),
    jobs: buildApiPath('ingestion/jobs'),
    job: (jobId: number) => buildApiPath(`ingestion/jobs/${jobId}`),
  },

  // Analysis
  analysis: {
    runs: buildApiPath('analysis/runs'),
    run: (runId: string) => buildApiPath(`analysis/runs/${runId}`),
  },

  // Proposals (under analysis prefix for Phase 1 API)
  proposals: buildApiPath('analysis/proposals'),
  proposal: (proposalId: string) => buildApiPath(`analysis/proposals/${proposalId}`),

  // AI Configuration
  agents: buildApiPath('agents'),
  providers: buildApiPath('providers'),
  ollamaModels: (host: string) => buildApiPath(`providers/ollama/models?host=${encodeURIComponent(host)}`),
  projects: buildApiPath('projects'),
  topics: buildApiPath('topics'),

  // Experiments
  experiments: {
    base: buildApiPath('experiments/topic-classification'),
    detail: (id: number) => buildApiPath(`experiments/topic-classification/${id}`),
  },

  // Noise Filtering
  noise: {
    stats: buildApiPath('noise/stats'),
    scoreMessage: (messageId: number) => buildApiPath(`noise/score/${messageId}`),
    scoreBatch: buildApiPath('noise/score-batch'),
  },

  // Knowledge Extraction & Versioning
  knowledge: buildApiPath('knowledge'),
  versions: buildApiPath('versions'),

  // Automation & Scheduler
  automation: {
    stats: buildApiPath('automation/stats'),
    trends: (period: string) => buildApiPath(`automation/trends?period=${period}`),
    rules: buildApiPath('automation/rules'),
    rule: (ruleId: string) => buildApiPath(`automation/rules/${ruleId}`),
    ruleTemplates: buildApiPath('automation/rules/templates'),
    ruleEvaluate: buildApiPath('automation/rules/evaluate'),
    rulePreview: (conditions: string, action: string) => buildApiPath(`automation/rules/preview?conditions=${encodeURIComponent(conditions)}&action=${action}`),
  },
  scheduler: {
    jobs: buildApiPath('scheduler/jobs'),
    job: (jobId: string) => buildApiPath(`scheduler/jobs/${jobId}`),
    jobTrigger: (jobId: string) => buildApiPath(`scheduler/jobs/${jobId}/trigger`),
    jobToggle: (jobId: string) => buildApiPath(`scheduler/jobs/${jobId}/toggle`),
  },
  notifications: {
    preferences: buildApiPath('notifications/preferences'),
    testEmail: buildApiPath('notifications/test-email'),
    testTelegram: buildApiPath('notifications/test-telegram'),
  },

  // WebSocket
  ws: '/ws',
} as const
