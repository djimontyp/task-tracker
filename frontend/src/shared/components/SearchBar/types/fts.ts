/**
 * FTS (Full-Text Search) types for keyword search API.
 *
 * These types match the backend response from GET /api/v1/search endpoint.
 * Snippets contain HTML with <mark> tags for highlighted matches.
 */

/** Brief topic information in message search results */
export interface FTSTopicBrief {
  id: string
  name: string
}

/** Topic search result from FTS endpoint */
export interface FTSTopicResult {
  id: string
  name: string
  description: string | null
  match_snippet: string
  rank: number
}

/** Message search result from FTS endpoint */
export interface FTSMessageResult {
  id: string
  content_snippet: string
  author: string
  timestamp: string
  topic: FTSTopicBrief | null
  rank: number
}

/** Atom type enum matching backend */
export type FTSAtomType =
  | 'problem'
  | 'solution'
  | 'decision'
  | 'question'
  | 'insight'
  | 'pattern'
  | 'requirement'

/** Atom search result from FTS endpoint */
export interface FTSAtomResult {
  id: string
  type: FTSAtomType
  title: string
  content_snippet: string
  user_approved: boolean
  rank: number
}

/** Response from GET /api/v1/search endpoint */
export interface FTSSearchResultsResponse {
  topics: FTSTopicResult[]
  messages: FTSMessageResult[]
  atoms: FTSAtomResult[]
  total_results: number
  query: string
}
