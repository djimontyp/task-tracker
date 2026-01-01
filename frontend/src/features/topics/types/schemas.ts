/**
 * Zod schemas for Topic API responses.
 *
 * These schemas validate runtime data from the backend
 * to catch contract violations early.
 */
import { z } from 'zod'
import { paginatedSchema } from '@/shared/lib/validation'

/**
 * Base Topic schema matching the Topic interface.
 */
export const TopicSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  icon: z.string().optional(),
  color: z.string().optional(),
  created_at: z.string().datetime({ offset: true }).or(z.string()),
  updated_at: z.string().datetime({ offset: true }).or(z.string()),
})

/**
 * Topic with additional counts (for dashboard/recent views).
 */
export const RecentTopicSchema = TopicSchema.extend({
  last_message_at: z.string(),
  message_count: z.number().int().nonnegative(),
  atoms_count: z.number().int().nonnegative(),
})

/**
 * Paginated topic list response.
 */
export const TopicListResponseSchema = paginatedSchema(TopicSchema)

/**
 * Recent topics response (dashboard).
 */
export const RecentTopicsResponseSchema = z.object({
  items: z.array(RecentTopicSchema),
  total: z.number().int().nonnegative(),
})

/**
 * Topic detail response (single topic).
 */
export const TopicDetailSchema = TopicSchema

/**
 * Create topic request schema.
 */
export const CreateTopicSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  icon: z.string().optional(),
})

/**
 * Update topic request schema.
 */
export const UpdateTopicSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

// Type exports inferred from schemas
export type TopicFromSchema = z.infer<typeof TopicSchema>
export type RecentTopicFromSchema = z.infer<typeof RecentTopicSchema>
export type TopicListResponseFromSchema = z.infer<typeof TopicListResponseSchema>
export type RecentTopicsResponseFromSchema = z.infer<typeof RecentTopicsResponseSchema>
