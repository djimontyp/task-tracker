export const API_VERSION = 'v1'
export const API_BASE_PATH = `/api/${API_VERSION}`

export function buildApiPath(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${API_BASE_PATH}/${cleanEndpoint}`
}

export const API_ENDPOINTS = {
  health: buildApiPath('health'),
  config: buildApiPath('config'),
  configScoring: buildApiPath('config/scoring'),

  messages: buildApiPath('messages'),
  message: (messageId: number) => buildApiPath(`messages/${messageId}`),
  messageInspect: (messageId: number) => buildApiPath(`messages/${messageId}/inspect`),
  updateAuthors: (chatId: string) => buildApiPath(`messages/update-authors?chat_id=${chatId}`),

  tasks: buildApiPath('tasks'),

  taskConfigs: buildApiPath('task-configs'),

  activity: buildApiPath('activity'),
  sidebarCounts: buildApiPath('sidebar-counts'),

  webhookSettings: buildApiPath('webhook-settings'),
  telegramWebhook: {
    set: buildApiPath('webhook-settings/telegram/set'),
    delete: buildApiPath('webhook-settings/telegram'),
    info: buildApiPath('webhook-settings/telegram/info'),
    ping: buildApiPath('webhook-settings/telegram/ping'),
    groups: buildApiPath('webhook-settings/telegram/groups'),
    group: (groupId: string | number) => buildApiPath(`webhook-settings/telegram/groups/${groupId}`),
    refreshNames: buildApiPath('webhook-settings/telegram/groups/refresh-names'),
    groupIds: buildApiPath('webhook-settings/telegram/group-ids'),
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
  provider: (providerId: string) => buildApiPath(`providers/${providerId}`),
  ollamaModels: (host: string) => buildApiPath(`providers/ollama/models?host=${encodeURIComponent(host)}`),
  projects: buildApiPath('projects'),
  project: (projectId: string) => buildApiPath(`projects/${projectId}`),
  topics: buildApiPath('topics'),
  topic: (topicId: string) => buildApiPath(`topics/${topicId}`),
  topicIcons: buildApiPath('topics/icons'),
  topicRecent: buildApiPath('topics/recent'),
  topicSuggestColor: (topicId: string) => buildApiPath(`topics/${topicId}/suggest-color`),
  topicAtoms: (topicId: string) => buildApiPath(`topics/${topicId}/atoms`),
  topicMessages: (topicId: string) => buildApiPath(`topics/${topicId}/messages`),

  atoms: buildApiPath('atoms'),
  atom: (atomId: string) => buildApiPath(`atoms/${atomId}`),

  noise: {
    stats: buildApiPath('noise/stats'),
    scoreMessage: (messageId: number) => buildApiPath(`noise/score/${messageId}`),
    scoreBatch: buildApiPath('noise/score-batch'),
  },

  knowledge: {
    extract: buildApiPath('knowledge/extract'),
  },

  // Search endpoints (FTS + semantic)
  search: {
    fts: buildApiPath('search'),
    messages: buildApiPath('search/messages'),
    atoms: buildApiPath('search/atoms'),
    topics: buildApiPath('search/topics'),
    messageSimilar: (messageId: number) => buildApiPath(`search/messages/${messageId}/similar`),
    messageDuplicates: (messageId: number) => buildApiPath(`search/messages/${messageId}/duplicates`),
  },

  // Dashboard endpoints
  dashboard: {
    metrics: buildApiPath('dashboard/metrics'),
    trends: buildApiPath('dashboard/trends'),
    messageTrends: buildApiPath('dashboard/message-trends'),
  },

  // Metrics endpoints
  metrics: {
    dashboard: buildApiPath('metrics/dashboard'),
  },

  // Monitoring endpoints
  monitoring: {
    metrics: buildApiPath('monitoring/metrics'),
    history: buildApiPath('monitoring/history'),
    scoringAccuracy: buildApiPath('monitoring/scoring-accuracy'),
  },

  // Executive Summary endpoints
  executiveSummary: {
    get: buildApiPath('executive-summary'),
    stats: (periodDays: number) => buildApiPath(`executive-summary/stats?period_days=${periodDays}`),
    export: buildApiPath('executive-summary/export'),
  },

  // Prompts endpoints
  prompts: {
    list: buildApiPath('prompts'),
    get: (promptType: string) => buildApiPath(`prompts/${promptType}`),
    update: (promptType: string) => buildApiPath(`prompts/${promptType}`),
    validate: buildApiPath('prompts/validate'),
  },

  // Assignments endpoints
  assignments: buildApiPath('assignments'),

  // Users endpoints
  users: {
    list: buildApiPath('users'),
    create: buildApiPath('users'),
    get: (userId: string) => buildApiPath(`users/${userId}`),
    me: buildApiPath('users/me'),
    telegramProfile: (userId: string) => buildApiPath(`users/${userId}/telegram-profile`),
    linkTelegram: (userId: string) => buildApiPath(`users/${userId}/link-telegram`),
  },

  // Versioning endpoints
  versions: {
    topicVersions: (topicId: string) => buildApiPath(`topics/${topicId}/versions`),
    topicVersionDiff: (topicId: string, version: number) =>
      buildApiPath(`topics/${topicId}/versions/${version}/diff`),
    topicVersionApprove: (topicId: string, version: number) =>
      buildApiPath(`topics/${topicId}/versions/${version}/approve`),
    topicVersionReject: (topicId: string, version: number) =>
      buildApiPath(`topics/${topicId}/versions/${version}/reject`),
    atomVersions: (atomId: string) => buildApiPath(`atoms/${atomId}/versions`),
    atomVersionDiff: (atomId: string, version: number) =>
      buildApiPath(`atoms/${atomId}/versions/${version}/diff`),
    atomVersionApprove: (atomId: string, version: number) =>
      buildApiPath(`atoms/${atomId}/versions/${version}/approve`),
    atomVersionReject: (atomId: string, version: number) =>
      buildApiPath(`atoms/${atomId}/versions/${version}/reject`),
    bulkApprove: buildApiPath('versions/bulk-approve'),
    bulkReject: buildApiPath('versions/bulk-reject'),
    pendingCount: buildApiPath('versions/pending-count'),
  },

  // Approval rules endpoints
  approvalRules: {
    list: buildApiPath('approval-rules'),
    create: buildApiPath('approval-rules'),
    preview: buildApiPath('approval-rules/preview'),
  },

  // Embeddings endpoints
  embeddings: {
    messagesBatch: buildApiPath('embeddings/messages/batch'),
    atomsBatch: buildApiPath('embeddings/atoms/batch'),
    message: (messageId: number) => buildApiPath(`embeddings/messages/${messageId}`),
    atom: (atomId: string) => buildApiPath(`embeddings/atoms/${atomId}`),
    topic: (topicId: string) => buildApiPath(`embeddings/topics/${topicId}`),
  },

  automation: {
    stats: buildApiPath('automation/stats'),
    trends: (period: string) => buildApiPath(`automation/trends?period=${period}`),
    rules: buildApiPath('automation/rules'),
    rule: (ruleId: string) => buildApiPath(`automation/rules/${ruleId}`),
    ruleToggle: (ruleId: string) => buildApiPath(`automation/rules/${ruleId}/toggle`),
    ruleStats: (ruleId: string) => buildApiPath(`automation/rules/${ruleId}/stats`),
    ruleTemplates: buildApiPath('automation/templates'),
    ruleEvaluate: buildApiPath('automation/rules/evaluate'),
    rulePreview: buildApiPath('automation/rules/preview'),
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

  // Test task endpoint
  testTask: buildApiPath('test-task'),

  ws: '/ws',
} as const
