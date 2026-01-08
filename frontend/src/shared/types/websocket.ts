/**
 * WebSocket Event Types
 *
 * Type-safe WebSocket event definitions for real-time communication.
 * All WebSocket handlers should use these types instead of `any`.
 */

import type { Message } from './index'

// ============================================================================
// Base Event Structure
// ============================================================================

/**
 * Base structure for all WebSocket events
 */
export interface BaseWebSocketEvent {
  type: string
  topic?: string
  seq?: number
  ts?: number
}

// ============================================================================
// System Events
// ============================================================================

/**
 * Connection confirmation event
 */
export interface ConnectionEvent extends BaseWebSocketEvent {
  type: 'connection'
  data: {
    connectionId: string
  }
}

/**
 * Ping event for connection health checks
 */
export interface PingEvent extends BaseWebSocketEvent {
  type: 'ping'
  ts: number
}

// ============================================================================
// Message Events (topic: 'messages')
// ============================================================================

export interface MessageNewEvent extends BaseWebSocketEvent {
  type: 'message.new' | 'message'
  data: Message
}

export interface MessageUpdatedEvent extends BaseWebSocketEvent {
  type: 'message.updated'
  data: {
    id?: number
    external_message_id: string
    persisted?: boolean
    avatar_url?: string | null
    author_id?: number
    author_name?: string
  }
}

export type MessageEvent = MessageNewEvent | MessageUpdatedEvent

// ============================================================================
// Knowledge Events (topic: 'knowledge')
// ============================================================================

export interface KnowledgeExtractionStartedEvent extends BaseWebSocketEvent {
  type: 'knowledge.extraction_started'
  data?: {
    message_count?: number
  }
}

export interface KnowledgeTopicCreatedEvent extends BaseWebSocketEvent {
  type: 'knowledge.topic_created'
  data?: {
    topic_id?: string
    topic_name?: string
  }
}

export interface KnowledgeAtomCreatedEvent extends BaseWebSocketEvent {
  type: 'knowledge.atom_created'
  data?: {
    atom_id?: string
    atom_type?: string
  }
}

export interface KnowledgeVersionCreatedEvent extends BaseWebSocketEvent {
  type: 'knowledge.version_created'
  data?: {
    entity_type?: string
    entity_id?: string
    version?: number
  }
}

export interface KnowledgeExtractionCompletedEvent extends BaseWebSocketEvent {
  type: 'knowledge.extraction_completed'
  data?: {
    topics_created?: number
    atoms_created?: number
    versions_created?: number
  }
}

export interface KnowledgeExtractionFailedEvent extends BaseWebSocketEvent {
  type: 'knowledge.extraction_failed'
  data?: {
    error?: string
  }
}

export interface KnowledgeExtractionCancellingEvent extends BaseWebSocketEvent {
  type: 'knowledge.extraction_cancelling'
  data?: {
    extraction_id?: string
  }
}

export interface KnowledgeExtractionCancelledEvent extends BaseWebSocketEvent {
  type: 'knowledge.extraction_cancelled'
  data?: {
    extraction_id?: string
    topics_created?: number
    atoms_created?: number
    versions_created?: number
  }
}

export type KnowledgeEvent =
  | KnowledgeExtractionStartedEvent
  | KnowledgeTopicCreatedEvent
  | KnowledgeAtomCreatedEvent
  | KnowledgeVersionCreatedEvent
  | KnowledgeExtractionCompletedEvent
  | KnowledgeExtractionFailedEvent
  | KnowledgeExtractionCancellingEvent
  | KnowledgeExtractionCancelledEvent

// ============================================================================
// Metrics Events (topic: 'metrics')
// ============================================================================

export interface MetricsUpdateEvent extends BaseWebSocketEvent {
  type: 'metrics:update'
  data: {
    topicQualityScore: number
    noiseRatio: number
    classificationAccuracy: number
    activeAnalysisRuns: number
    trends: {
      topicQualityScore: { direction: 'up' | 'down' | 'stable'; change: number }
      classificationAccuracy: { direction: 'up' | 'down' | 'stable'; change: number }
      activeAnalysisRuns: { direction: 'up' | 'down' | 'stable'; change: number }
    }
  }
}

export type MetricsEvent = MetricsUpdateEvent

// ============================================================================
// Automation Events (topic: 'automation', 'scheduler')
// ============================================================================

export interface AutomationBaseEvent extends BaseWebSocketEvent {
  event: string
}

export interface JobCompletedEvent extends AutomationBaseEvent {
  event: 'job_completed'
  data?: {
    job_id?: string
    job_name?: string
  }
}

export interface RuleTriggeredEvent extends AutomationBaseEvent {
  event: 'rule_triggered'
  data?: {
    rule_id?: string
    rule_name?: string
  }
}

export interface ApprovalProcessedEvent extends AutomationBaseEvent {
  event: 'approval_processed'
  data?: {
    approval_id?: string
    status?: string
  }
}

export type AutomationEvent = JobCompletedEvent | RuleTriggeredEvent | ApprovalProcessedEvent

// ============================================================================
// Noise Filtering Events (topic: 'noise_filtering')
// ============================================================================

export interface NoiseFilteringBaseEvent extends BaseWebSocketEvent {
  topic: 'noise_filtering'
  event: string
}

export interface MessageScoredEvent extends NoiseFilteringBaseEvent {
  event: 'message_scored'
  data?: {
    message_id?: string
    score?: number
  }
}

export interface BatchScoredEvent extends NoiseFilteringBaseEvent {
  event: 'batch_scored'
  data: {
    scored: number
  }
}

export type NoiseFilteringEvent = MessageScoredEvent | BatchScoredEvent

// ============================================================================
// Monitoring Events (topic: 'monitoring')
// ============================================================================

export interface TaskStartedEvent extends BaseWebSocketEvent {
  type: 'task_started'
  task_name: string
  status: string
  timestamp: string
  data: {
    task_id: string
    params?: Record<string, unknown>
  }
}

export interface TaskCompletedEvent extends BaseWebSocketEvent {
  type: 'task_completed'
  task_name: string
  status: string
  timestamp: string
  data: {
    task_id: string
    duration_ms?: number
    params?: Record<string, unknown>
  }
}

export interface TaskFailedEvent extends BaseWebSocketEvent {
  type: 'task_failed'
  task_name: string
  status: string
  timestamp: string
  data: {
    task_id: string
    error_message?: string
    params?: Record<string, unknown>
  }
}

export type MonitoringEvent = TaskStartedEvent | TaskCompletedEvent | TaskFailedEvent

// ============================================================================
// Versioning Events (topic: 'versions')
// ============================================================================

export interface PendingCountUpdatedEvent extends BaseWebSocketEvent {
  event: 'pending_count_updated'
  count: number
  topics?: number
  atoms?: number
}

export type VersioningEvent = PendingCountUpdatedEvent

// ============================================================================
// Ingestion Events (topic: 'ingestion')
// ============================================================================

export interface IngestionStartedEvent extends BaseWebSocketEvent {
  type: 'ingestion.started'
  data?: {
    source?: string
  }
}

export interface IngestionProgressEvent extends BaseWebSocketEvent {
  type: 'ingestion.progress'
  data?: {
    processed?: number
    total?: number
  }
}

export interface IngestionCompletedEvent extends BaseWebSocketEvent {
  type: 'ingestion.completed'
  data?: {
    processed?: number
  }
}

export type IngestionEvent = IngestionStartedEvent | IngestionProgressEvent | IngestionCompletedEvent

// ============================================================================
// Union Type for All Events
// ============================================================================

/**
 * Union type of all possible WebSocket events.
 * Use this for generic WebSocket message handlers.
 */
export type WebSocketEvent =
  | ConnectionEvent
  | PingEvent
  | MessageEvent
  | KnowledgeEvent
  | MetricsEvent
  | AutomationEvent
  | NoiseFilteringEvent
  | MonitoringEvent
  | VersioningEvent
  | IngestionEvent

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if the event is a message event
 */
export function isMessageEvent(event: WebSocketEvent): event is MessageEvent {
  return event.type === 'message.new' || event.type === 'message' || event.type === 'message.updated'
}

/**
 * Check if the event is a knowledge event
 */
export function isKnowledgeEvent(event: WebSocketEvent): event is KnowledgeEvent {
  return typeof event.type === 'string' && event.type.startsWith('knowledge.')
}

/**
 * Check if the event is a metrics update event
 */
export function isMetricsEvent(event: WebSocketEvent): event is MetricsEvent {
  return event.type === 'metrics:update'
}

/**
 * Check if the event is an automation event
 */
export function isAutomationEvent(event: unknown): event is AutomationEvent {
  if (!event || typeof event !== 'object') return false
  const e = event as Record<string, unknown>
  return (
    e.event === 'job_completed' ||
    e.event === 'rule_triggered' ||
    e.event === 'approval_processed'
  )
}

/**
 * Check if the event is a monitoring/task event
 */
export function isMonitoringEvent(event: WebSocketEvent): event is MonitoringEvent {
  return (
    event.type === 'task_started' ||
    event.type === 'task_completed' ||
    event.type === 'task_failed'
  )
}
