/**
 * Zod schemas for Message API responses.
 *
 * These schemas validate runtime data from the backend
 * to catch contract violations early.
 */
import { z } from 'zod'
import { paginatedSchema } from '@/shared/lib/validation'

/**
 * Noise classification enum values.
 */
export const NoiseClassificationSchema = z.enum(['noise', 'signal', 'weak_signal'])

/**
 * Noise factors schema.
 */
export const NoiseFactorsSchema = z.object({
  content: z.number().min(0).max(1),
  author: z.number().min(0).max(1),
  temporal: z.number().min(0).max(1),
  topics: z.number().min(0).max(1),
})

/**
 * Base Message schema matching the Message interface.
 * Handles both new normalized fields and legacy compatibility.
 */
export const MessageSchema = z.object({
  id: z.union([z.number(), z.string()]),
  external_message_id: z.string(),
  content: z.string(),

  // Normalized fields
  author_id: z.number(),
  author_name: z.string(),

  sent_at: z.string(),
  source_id: z.number().optional(),
  source_name: z.string(),
  analyzed: z.boolean().optional(),
  avatar_url: z.string().nullable().optional(),
  persisted: z.boolean().optional(),

  // Platform-specific
  telegram_profile_id: z.number().nullable().optional(),

  // Knowledge extraction
  topic_id: z.number().nullable().optional(),
  topic_name: z.string().nullable().optional(),

  // Noise classification
  importance_score: z.number().min(0).max(1).optional(),
  noise_classification: NoiseClassificationSchema.optional(),
  noise_factors: NoiseFactorsSchema.optional(),

  // Legacy fields (for backward compatibility)
  author: z.string().optional(),
  sender: z.string().optional(),
  text: z.string().optional(),
  timestamp: z.string().optional(),
  source: z.string().optional(),
  telegram_user_id: z.number().nullable().optional(),
  telegram_username: z.string().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  isTask: z.boolean().optional(),
  is_task: z.boolean().optional(),
  taskId: z.string().optional(),
  task_id: z.string().optional(),
})

/**
 * Paginated message list response.
 */
export const MessageListResponseSchema = paginatedSchema(MessageSchema)

/**
 * Simple message list response (array without pagination).
 */
export const MessageArrayResponseSchema = z.array(MessageSchema)

/**
 * Message detail response (single message).
 */
export const MessageDetailSchema = MessageSchema

/**
 * Message inspect classification data.
 */
export const MessageClassificationSchema = z.object({
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  topic_id: z.string(),
  topic_title: z.string(),
  noise_score: z.number().min(0).max(1),
  urgency_score: z.number().min(0).max(1),
})

/**
 * Message inspect atoms/entities data.
 */
export const MessageAtomsSchema = z.object({
  entities: z.object({
    people: z.array(z.string()),
    places: z.array(z.string()),
    organizations: z.array(z.string()),
    concepts: z.array(z.string()),
  }),
  keywords: z.array(
    z.object({
      text: z.string(),
      relevance: z.number().min(0).max(1),
    })
  ),
  embedding: z.array(z.number()).optional(),
  similarMessages: z
    .array(
      z.object({
        id: z.string(),
        preview: z.string(),
        similarity: z.number().min(0).max(1),
      })
    )
    .optional(),
})

/**
 * Message history action enum.
 */
export const MessageHistoryActionSchema = z.enum([
  'classified',
  'reassigned',
  'approved',
  'rejected',
])

/**
 * Message history entry.
 */
export const MessageHistoryEntrySchema = z.object({
  timestamp: z.string(),
  action: MessageHistoryActionSchema,
  from_topic: z.string().optional(),
  to_topic: z.string().optional(),
  admin_user: z.string().optional(),
  reason: z.string().optional(),
})

/**
 * Full message inspect data response.
 */
export const MessageInspectDataSchema = z.object({
  message: z.object({
    id: z.string(),
    content: z.string(),
    source: z.enum(['telegram', 'manual']),
    created_at: z.string(),
    telegram_message_id: z.number().optional(),
  }),
  classification: MessageClassificationSchema,
  atoms: MessageAtomsSchema,
  history: z.array(MessageHistoryEntrySchema),
})

// Type exports inferred from schemas
export type MessageFromSchema = z.infer<typeof MessageSchema>
export type MessageListResponseFromSchema = z.infer<typeof MessageListResponseSchema>
export type NoiseClassificationFromSchema = z.infer<typeof NoiseClassificationSchema>
export type NoiseFactorsFromSchema = z.infer<typeof NoiseFactorsSchema>
export type MessageInspectDataFromSchema = z.infer<typeof MessageInspectDataSchema>
