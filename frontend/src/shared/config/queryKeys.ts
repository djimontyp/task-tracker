/**
 * Centralized query keys for TanStack Query
 *
 * Pattern: Each domain has:
 * - all: Base key for invalidating all queries in domain
 * - list: For list queries (with optional filters)
 * - detail: For single item queries (by ID)
 *
 * Usage:
 *   import { queryKeys } from '@/shared/config'
 *   useQuery({ queryKey: queryKeys.messages.list({ status: 'pending' }), ... })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.messages.all })
 */

export const queryKeys = {
  messages: {
    all: ['messages'] as const,
    list: (filters?: object) => ['messages', 'list', filters] as const,
    detail: (id: number) => ['messages', 'detail', id] as const,
  },
  atoms: {
    all: ['atoms'] as const,
    list: (filters?: object) => ['atoms', 'list', filters] as const,
    detail: (id: number) => ['atoms', 'detail', id] as const,
  },
  topics: {
    all: ['topics'] as const,
    list: (filters?: object) => ['topics', 'list', filters] as const,
    detail: (id: number) => ['topics', 'detail', id] as const,
  },
  agents: {
    all: ['agents'] as const,
    list: () => ['agents', 'list'] as const,
    detail: (id: number) => ['agents', 'detail', id] as const,
  },
  providers: {
    all: ['providers'] as const,
    list: () => ['providers', 'list'] as const,
    detail: (id: number) => ['providers', 'detail', id] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: () => ['projects', 'list'] as const,
    detail: (id: number) => ['projects', 'detail', id] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: (filters?: object) => ['tasks', 'list', filters] as const,
    detail: (id: number) => ['tasks', 'detail', id] as const,
  },
  analysis: {
    all: ['analysis'] as const,
    runs: () => ['analysis', 'runs'] as const,
    run: (id: number) => ['analysis', 'run', id] as const,
  },
  proposals: {
    all: ['proposals'] as const,
    list: (filters?: object) => ['proposals', 'list', filters] as const,
    detail: (id: string) => ['proposals', 'detail', id] as const,
  },
  noise: {
    all: ['noise'] as const,
    stats: () => ['noise', 'stats'] as const,
  },
  automation: {
    all: ['automation'] as const,
    stats: () => ['automation', 'stats'] as const,
    rules: () => ['automation', 'rules'] as const,
    rule: (id: string) => ['automation', 'rule', id] as const,
    trends: (period: string) => ['automation', 'trends', period] as const,
  },
  scheduler: {
    all: ['scheduler'] as const,
    jobs: () => ['scheduler', 'jobs'] as const,
    job: (id: string) => ['scheduler', 'job', id] as const,
  },
  knowledge: {
    all: ['knowledge'] as const,
    list: (filters?: object) => ['knowledge', 'list', filters] as const,
    versions: (entityId: number) => ['knowledge', 'versions', entityId] as const,
  },
  config: {
    all: ['config'] as const,
    scoring: () => ['config', 'scoring'] as const,
  },
  health: {
    all: ['health'] as const,
    check: () => ['health', 'check'] as const,
  },
  activity: {
    all: ['activity'] as const,
    list: (filters?: object) => ['activity', 'list', filters] as const,
  },
  sidebar: {
    counts: () => ['sidebar', 'counts'] as const,
  },
  telegram: {
    all: ['telegram'] as const,
    webhook: () => ['telegram', 'webhook'] as const,
    groups: () => ['telegram', 'groups'] as const,
    group: (id: string | number) => ['telegram', 'group', id] as const,
  },
  ingestion: {
    all: ['ingestion'] as const,
    jobs: () => ['ingestion', 'jobs'] as const,
    job: (id: number) => ['ingestion', 'job', id] as const,
  },
} as const

export type QueryKeys = typeof queryKeys
