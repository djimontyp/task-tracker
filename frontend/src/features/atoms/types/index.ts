export enum AtomType {
  Problem = 'problem',
  Solution = 'solution',
  Decision = 'decision',
  Question = 'question',
  Insight = 'insight',
  Pattern = 'pattern',
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
  id: number
  type: AtomType
  title: string
  content: string
  confidence: number | null
  user_approved: boolean
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface CreateAtom {
  type: AtomType
  title: string
  content: string
  confidence?: number
  user_approved?: boolean
  meta?: Record<string, any>
}

export interface UpdateAtom {
  type?: AtomType
  title?: string
  content?: string
  confidence?: number
  user_approved?: boolean
  meta?: Record<string, any>
}

export interface AtomListResponse {
  items: Atom[]
  total: number
  page: number
  page_size: number
}

export interface AtomLink {
  from_atom_id: number
  to_atom_id: number
  link_type: LinkType
  strength: number | null
  created_at: string
}

export interface CreateAtomLink {
  from_atom_id: number
  to_atom_id: number
  link_type: LinkType
  strength?: number
}

export interface TopicAtom {
  topic_id: string
  atom_id: number
  position: number | null
  note: string | null
  created_at: string
}

export interface CreateTopicAtom {
  topic_id: string
  atom_id: number
  position?: number
  note?: string
}
