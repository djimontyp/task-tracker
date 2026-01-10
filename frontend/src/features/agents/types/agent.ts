/**
 * Agent Configuration Types
 *
 * TypeScript interfaces matching backend AgentConfig models
 */

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  provider_id: string;
  model_name: string;
  system_prompt: string;
  temperature?: number;
  max_tokens?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentConfigCreate {
  name: string;
  description?: string;
  provider_id: string;
  model_name: string;
  system_prompt: string;
  temperature?: number;
  max_tokens?: number;
  is_active?: boolean;
}

export interface AgentConfigUpdate {
  name?: string;
  description?: string;
  provider_id?: string;
  model_name?: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  is_active?: boolean;
}

export interface AgentConfigDetail extends AgentConfig {
  // Extended with provider details when fetched
  provider?: {
    id: string;
    name: string;
    type: string;
  };
  // Extended with assigned tasks when fetched
  tasks?: Array<{
    id: string;
    name: string;
  }>;
}

export interface AgentStats {
  last_run_at: string | null;
  success_rate: number;
  total_runs_24h: number;
  avg_duration_sec: number;
  atoms_created_24h: number;
}

// Golden Set Testing
export interface GoldenSetTestRequest {
  mode: 'quick' | 'medium';
  golden_set_path?: string;
}

export interface ScoringResult {
  msg_id: string;
  content: string;
  expected_score: number;
  actual_score: number | null;  // null if LLM failed to respond
  expected_class: string;
  actual_class: string | null;  // null if LLM failed to respond
  confidence: string;
  score_diff: number;
  status: 'pass' | 'warning' | 'fail' | 'error';  // 'error' when LLM fails
  error_message?: string;  // Error details if status is 'error'
}

export interface GoldenSetTestReport {
  agent_id: string;
  agent_name: string;
  model: string;
  provider_name: string;
  mode: string;
  total_messages: number;
  scoring_pass: number;
  scoring_warning: number;
  scoring_fail: number;
  classification_exact: number;
  classification_alt: number;
  classification_fail: number;
  avg_score_diff: number;
  max_score_diff: number;
  duration_seconds: number;
  verdict: 'acceptable' | 'needs_improvement' | 'failed';
  failures: ScoringResult[];
  all_results?: ScoringResult[];
}

export interface GoldenSetTestProgress {
  current_message: number;
  total_messages: number;
  current_content: string;
  status: 'pass' | 'warning' | 'fail';
  actual_score: number;
  expected_score: number;
}
