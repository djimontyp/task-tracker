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
