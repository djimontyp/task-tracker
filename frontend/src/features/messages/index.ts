/**
 * Messages feature module - message feed, error boundary, WebSocket integration
 */

export * from './api/messageService'
export * from './components'
export * from './hooks/useMessagesFeed'
// Types are re-exported from components and hooks - avoid duplication
export type {
  Message,
  NoiseClassification,
  NoiseFactors,
  MessageList,
  MessageStatus,
  MessageEventPayload,
  MessageUpdatedPayload,
  MessageInspectData,
  MessageInspectModalProps,
  TabValue,
} from './types'