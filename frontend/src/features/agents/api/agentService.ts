/**
 * Agent API Service
 *
 * Client for agent configuration and task assignment endpoints
 */

import {
  AgentConfig,
  AgentConfigCreate,
  AgentConfigUpdate,
} from "../types";
import { AgentTaskAssignment, AgentTaskAssignmentCreate } from "../types";
import { API_ENDPOINTS } from "@/shared/config/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class AgentService {
  /**
   * List all agents with optional filters
   */
  async listAgents(params?: {
    skip?: number;
    limit?: number;
    active_only?: boolean;
    provider_id?: string;
  }): Promise<AgentConfig[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.set("skip", params.skip.toString());
    if (params?.limit !== undefined) queryParams.set("limit", params.limit.toString());
    if (params?.active_only) queryParams.set("active_only", "true");
    if (params?.provider_id) queryParams.set("provider_id", params.provider_id);

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.agents}?${queryParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch agents: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get single agent by ID
   */
  async getAgent(id: string): Promise<AgentConfig> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.agents}/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Agent not found");
      }
      throw new Error(`Failed to fetch agent: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create new agent
   */
  async createAgent(data: AgentConfigCreate): Promise<AgentConfig> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.agents}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      if (response.status === 409) {
        throw new Error(error.detail || "Agent name already exists");
      }
      if (response.status === 404) {
        throw new Error(error.detail || "Provider not found");
      }
      throw new Error(error.detail || "Failed to create agent");
    }

    return response.json();
  }

  /**
   * Update existing agent
   */
  async updateAgent(id: string, data: AgentConfigUpdate): Promise<AgentConfig> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.agents}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      if (response.status === 404) {
        throw new Error("Agent not found");
      }
      throw new Error(error.detail || "Failed to update agent");
    }

    return response.json();
  }

  /**
   * Delete agent
   */
  async deleteAgent(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.agents}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Agent not found");
      }
      throw new Error(`Failed to delete agent: ${response.statusText}`);
    }
  }

  /**
   * Get tasks assigned to agent
   */
  async getAgentTasks(
    agentId: string,
    activeOnly: boolean = false
  ): Promise<AgentTaskAssignment[]> {
    const queryParams = new URLSearchParams();
    if (activeOnly) queryParams.set("active_only", "true");

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.agents}/${agentId}/tasks?${queryParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch agent tasks: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Assign task to agent
   */
  async assignTask(
    agentId: string,
    data: Omit<AgentTaskAssignmentCreate, "agent_id">
  ): Promise<AgentTaskAssignment> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.agents}/${agentId}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...data, agent_id: agentId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      if (response.status === 409) {
        throw new Error("Task already assigned to this agent");
      }
      if (response.status === 404) {
        throw new Error("Agent or task not found");
      }
      throw new Error(error.detail || "Failed to assign task");
    }

    return response.json();
  }

  /**
   * Unassign task from agent
   */
  async unassignTask(agentId: string, taskId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.agents}/${agentId}/tasks/${taskId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Assignment not found");
      }
      throw new Error(`Failed to unassign task: ${response.statusText}`);
    }
  }

  /**
   * Test agent with custom prompt
   */
  async testAgent(
    id: string,
    prompt: string
  ): Promise<{
    agent_id: string;
    agent_name: string;
    prompt: string;
    response: string;
    elapsed_time: number;
    model_name: string;
    provider_name: string;
    provider_type: string;
  }> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.agents}/${id}/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: response.statusText,
      }));
      if (response.status === 404) {
        throw new Error("Agent not found");
      }
      if (response.status === 400) {
        throw new Error(error.detail || "Invalid prompt");
      }
      throw new Error(error.detail || "Failed to test agent");
    }

    return response.json();
  }
}

export const agentService = new AgentService();
