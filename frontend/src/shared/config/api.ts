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

  // WebSocket
  ws: '/ws',
} as const
