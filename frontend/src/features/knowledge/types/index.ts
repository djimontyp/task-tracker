export interface TopicVersion {
  id: number;
  topic_id: number;
  version: number;
  data: {
    name: string;
    description: string;
    icon?: string;
    color?: string;
    confidence: number;
  };
  created_at: string;
  created_by: string | null;
  approved: boolean;
  approved_at: string | null;
}

export interface AtomVersion {
  id: number;
  atom_id: number;
  version: number;
  data: {
    type: string;
    title: string;
    content: string;
    confidence: number;
  };
  created_at: string;
  created_by: string | null;
  approved: boolean;
  approved_at: string | null;
}

export interface VersionChange {
  type: string;
  path: string;
  old_value: any;
  new_value: any;
}

export interface VersionDiff {
  from_version: number;
  to_version: number;
  changes: VersionChange[];
  summary: string;
}

export type PeriodType = 'last_24h' | 'last_7d' | 'last_30d' | 'custom';

export interface PeriodRequest {
  period_type: PeriodType;
  topic_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface KnowledgeExtractionRequest {
  message_ids?: number[];
  period?: PeriodRequest;
  agent_config_id: string;
}

export interface KnowledgeExtractionResponse {
  extraction_id: string;
  message_count: number;
  message?: string;
  agent_config_id: string;
}

export interface ExtractionProgress {
  status: 'idle' | 'running' | 'completed' | 'failed';
  topics_created: number;
  atoms_created: number;
  versions_created: number;
  error?: string;
}
