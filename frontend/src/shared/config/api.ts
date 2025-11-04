export const API_VERSION = 'v1'
export const API_BASE_PATH = `/api/${API_VERSION}`

export function buildApiPath(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${API_BASE_PATH}/${cleanEndpoint}`
}

export const API_ENDPOINTS = {
  health: buildApiPath('health'),
  config: buildApiPath('config'),

  messages: buildApiPath('messages'),
  updateAuthors: (chatId: string) => buildApiPath(`messages/update-authors?chat_id=${chatId}`),

  tasks: buildApiPath('tasks'),

  taskConfigs: buildApiPath('task-configs'),

  activity: buildApiPath('activity'),
  sidebarCounts: buildApiPath('sidebar-counts'),

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

  analysis: {
    runs: buildApiPath('analysis/runs'),
    run: (runId: string) => buildApiPath(`analysis/runs/${runId}`),
  },

  proposals: buildApiPath('analysis/proposals'),
  proposal: (proposalId: string) => buildApiPath(`analysis/proposals/${proposalId}`),

  agents: buildApiPath('agents'),
  providers: buildApiPath('providers'),
  ollamaModels: (host: string) => buildApiPath(`providers/ollama/models?host=${encodeURIComponent(host)}`),
  projects: buildApiPath('projects'),
  topics: buildApiPath('topics'),

  noise: {
    stats: buildApiPath('noise/stats'),
    scoreMessage: (messageId: number) => buildApiPath(`noise/score/${messageId}`),
    scoreBatch: buildApiPath('noise/score-batch'),
  },

  knowledge: buildApiPath('knowledge'),
  versions: buildApiPath('versions'),

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

  ws: '/ws',
} as const
