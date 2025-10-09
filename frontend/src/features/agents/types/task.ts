/**
 * Task Configuration Types
 *
 * TypeScript interfaces matching backend TaskConfig models
 */

export interface SchemaPropertyConfig {
  type: string
  description?: string
}

export interface JsonSchema {
  type: 'object'
  properties: Record<string, SchemaPropertyConfig>
  required: string[]
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
