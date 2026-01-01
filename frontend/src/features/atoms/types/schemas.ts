/**
 * Zod schemas for Atom API responses.
 *
 * These schemas validate runtime data from the backend
 * to catch contract violations early.
 */
import { z } from 'zod'
import { paginatedSchema } from '@/shared/lib/validation'

/**
 * Atom type enum values.
 */
export const AtomTypeSchema = z.enum([
  'problem',
  'solution',
  'decision',
  'question',
  'insight',
  'pattern',
  'requirement',
])

/**
 * Link type enum values.
 */
export const LinkTypeSchema = z.enum([
  'continues',
  'solves',
  'contradicts',
  'supports',
  'refines',
  'relates_to',
  'depends_on',
])

/**
 * Base Atom schema matching the Atom interface.
 */
export const AtomSchema = z.object({
  id: z.string(),
  type: AtomTypeSchema,
  title: z.string().min(1),
  content: z.string(),
  confidence: z.number().min(0).max(1).nullable(),
  user_approved: z.boolean(),
  archived: z.boolean(),
  archived_at: z.string().nullable(),
  meta: z.record(z.string(), z.unknown()).nullable(),
  pending_versions_count: z.number().int().nonnegative(),
  detected_language: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * Paginated atom list response.
 */
export const AtomListResponseSchema = paginatedSchema(AtomSchema)

/**
 * Atom detail response (single atom).
 */
export const AtomDetailSchema = AtomSchema

/**
 * Atom link schema.
 */
export const AtomLinkSchema = z.object({
  from_atom_id: z.string(),
  to_atom_id: z.string(),
  link_type: LinkTypeSchema,
  strength: z.number().min(0).max(1).nullable(),
  created_at: z.string(),
})

/**
 * Topic-Atom association schema.
 */
export const TopicAtomSchema = z.object({
  topic_id: z.string(),
  atom_id: z.string(),
  position: z.number().int().nullable(),
  note: z.string().nullable(),
  created_at: z.string(),
})

/**
 * Create atom request schema.
 */
export const CreateAtomSchema = z.object({
  type: AtomTypeSchema,
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  confidence: z.number().min(0).max(1).optional(),
  user_approved: z.boolean().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Update atom request schema.
 */
export const UpdateAtomSchema = z.object({
  type: AtomTypeSchema.optional(),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  user_approved: z.boolean().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Create atom link request schema.
 */
export const CreateAtomLinkSchema = z.object({
  from_atom_id: z.string(),
  to_atom_id: z.string(),
  link_type: LinkTypeSchema,
  strength: z.number().min(0).max(1).optional(),
})

// Type exports inferred from schemas
export type AtomFromSchema = z.infer<typeof AtomSchema>
export type AtomListResponseFromSchema = z.infer<typeof AtomListResponseSchema>
export type AtomLinkFromSchema = z.infer<typeof AtomLinkSchema>
export type TopicAtomFromSchema = z.infer<typeof TopicAtomSchema>
