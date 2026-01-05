export enum AtomType {
  Problem = 'problem',
  Solution = 'solution',
  Decision = 'decision',
  Question = 'question',
  Insight = 'insight',
  Idea = 'idea',
  Blocker = 'blocker',
  Risk = 'risk',
  Requirement = 'requirement',
}

export enum LinkType {
  Continues = 'continues',
  Solves = 'solves',
  Contradicts = 'contradicts',
  Supports = 'supports',
  Refines = 'refines',
  RelatesTo = 'relates_to',
  DependsOn = 'depends_on',
}

export interface Atom {
  id: string
  type: AtomType
  title: string
  content: string
  confidence: number | null
  user_approved: boolean
  archived: boolean
  archived_at: string | null
  meta: Record<string, unknown> | null
  /** Number of unapproved versions (computed on backend) */
  pending_versions_count: number
  /** AI-detected language of content (ISO 639-1). Used for language mismatch warnings. */
  detected_language?: string | null
  created_at: string
  updated_at: string
}

export interface CreateAtom {
  type: AtomType
  title: string
  content: string
  confidence?: number
  user_approved?: boolean
  meta?: Record<string, unknown>
}

export interface UpdateAtom {
  type?: AtomType
  title?: string
  content?: string
  confidence?: number
  user_approved?: boolean
  meta?: Record<string, unknown>
}

export interface AtomListResponse {
  items: Atom[]
  total: number
  page: number
  page_size: number
}

export interface AtomLink {
  from_atom_id: string
  to_atom_id: string
  link_type: LinkType
  strength: number | null
  created_at: string
}

export interface CreateAtomLink {
  from_atom_id: string
  to_atom_id: string
  link_type: LinkType
  strength?: number
}

export interface TopicAtom {
  topic_id: string
  atom_id: string
  position: number | null
  note: string | null
  created_at: string
}

export interface CreateTopicAtom {
  topic_id: string
  atom_id: string
  position?: number
  note?: string
}

export interface BulkOperationResult {
  updated_count: number
  atom_ids: string[]
}

// Bulk operation request/response types
export interface BulkOperationRequest {
  atom_ids: string[]
}

export interface BulkApproveResponse {
  approved_count: number
  failed_ids: string[]
  errors: string[]
}

export interface BulkArchiveResponse {
  archived_count: number
  failed_ids: string[]
  errors: string[]
}

export interface BulkDeleteResponse {
  deleted_count: number
  failed_ids: string[]
  errors: string[]
}
