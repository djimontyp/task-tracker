/**
 * Task Configuration Types
 *
 * TypeScript interfaces matching backend TaskConfig models
 */

export type FieldType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'date' | 'email' | 'url'

export interface SchemaPropertyConfig {
  type: FieldType
  description?: string
}

export interface JsonSchema {
  type: 'object'
  properties: Record<string, SchemaPropertyConfig>
  required: string[]
}

export interface SchemaField {
  name: string
  type: FieldType
  description?: string
  required?: boolean
}

export interface TaskConfig {
  id: string;
  name: string;
  description?: string;
  response_schema: JsonSchema;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskConfigCreate {
  name: string;
  description?: string;
  response_schema: JsonSchema;
  is_active?: boolean;
}

export interface TaskConfigUpdate {
  name?: string;
  description?: string;
  response_schema?: JsonSchema;
  is_active?: boolean;
}

export interface TaskConfigDetail extends TaskConfig {
  // Extended with assigned agents when fetched
  agents?: Array<{
    id: string;
    name: string;
  }>;
}

// Agent-Task Assignment types
export interface AgentTaskAssignment {
  id: string;
  agent_id: string;
  task_id: string;
  is_active: boolean;
  assigned_at: string;
}

export interface AgentTaskAssignmentCreate {
  agent_id: string;
  task_id: string;
  is_active?: boolean;
}

export interface AgentTaskAssignmentWithDetails {
  id: string;
  agent_id: string;
  task_id: string;
  is_active: boolean;
  assigned_at: string;
  agent_name: string;
  task_name: string;
  provider_name: string;
  provider_type: string;
}
