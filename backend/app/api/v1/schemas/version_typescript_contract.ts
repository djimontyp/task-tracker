/**
 * TypeScript type definitions for Version API
 * Auto-generated from Pydantic schemas
 *
 * API Base URL: /api/v1
 */

// Version record responses
export interface TopicVersionResponse {
  id: number;
  topic_id: number;
  version: number;
  data: Record<string, any>;
  created_at: string; // ISO 8601 datetime
  created_by: string | null;
  approved: boolean;
  approved_at: string | null; // ISO 8601 datetime
}

export interface AtomVersionResponse {
  id: number;
  atom_id: number;
  version: number;
  data: Record<string, any>;
  created_at: string; // ISO 8601 datetime
  created_by: string | null;
  approved: boolean;
  approved_at: string | null; // ISO 8601 datetime
}

// Version diff responses
export interface VersionChange {
  type: string; // e.g., "values_changed", "type_changes"
  path: string; // JSON path to changed field
  old_value: any;
  new_value: any;
}

export interface VersionDiffResponse {
  from_version: number;
  to_version: number;
  changes: VersionChange[];
  summary: string;
}

// Request bodies (empty, but need to send {} in POST)
export interface ApproveVersionRequest {}
export interface RejectVersionRequest {}

/**
 * API Endpoints
 *
 * Topic Versions:
 * - GET    /api/v1/topics/{topic_id}/versions
 * - GET    /api/v1/topics/{topic_id}/versions/{version}/diff?compare_to={version}
 * - POST   /api/v1/topics/{topic_id}/versions/{version}/approve
 * - POST   /api/v1/topics/{topic_id}/versions/{version}/reject
 *
 * Atom Versions:
 * - GET    /api/v1/atoms/{atom_id}/versions
 * - GET    /api/v1/atoms/{atom_id}/versions/{version}/diff?compare_to={version}
 * - POST   /api/v1/atoms/{atom_id}/versions/{version}/approve
 * - POST   /api/v1/atoms/{atom_id}/versions/{version}/reject
 */

// Example usage:
/*
// Get all versions for a topic
const versions: TopicVersionResponse[] = await fetch('/api/v1/topics/1/versions')
  .then(res => res.json());

// Get diff between versions 1 and 2
const diff: VersionDiffResponse = await fetch('/api/v1/topics/1/versions/2/diff?compare_to=1')
  .then(res => res.json());

// Approve version 2
const approvedVersion: TopicVersionResponse = await fetch('/api/v1/topics/1/versions/2/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
}).then(res => res.json());

// Reject version 2
const rejectedVersion: TopicVersionResponse = await fetch('/api/v1/topics/1/versions/2/reject', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
}).then(res => res.json());
*/
