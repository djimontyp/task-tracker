/**
 * Agent API Service
 *
 * Client for agent configuration and task assignment endpoints
 */

import apiClient from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import type {
  AgentConfig,
  AgentConfigCreate,
  AgentConfigUpdate,
  AgentTaskAssignment,
  AgentTaskAssignmentCreate,
  AgentTaskAssignmentWithDetails,
} from '../types'

interface AgentTestResponse {
  agent_id: string
  agent_name: string
  prompt: string
  response: string
  elapsed_time: number
  model_name: string
  provider_name: string
  provider_type: string
}

class AgentService {
  /**
   * List all agents with optional filters
   */
  async listAgents(params?: {
    skip?: number
    limit?: number
    active_only?: boolean
    provider_id?: string
  }): Promise<AgentConfig[]> {
    const response = await apiClient.get<AgentConfig[]>(API_ENDPOINTS.agents, {
      params: {
        skip: params?.skip,
        limit: params?.limit,
        active_only: params?.active_only || undefined,
        provider_id: params?.provider_id,
      },
    })
    return response.data
  }

  /**
   * Get single agent by ID
   */
  async getAgent(id: string): Promise<AgentConfig> {
    const response = await apiClient.get<AgentConfig>(`${API_ENDPOINTS.agents}/${id}`)
    return response.data
  }

  /**
   * Create new agent
   */
  async createAgent(data: AgentConfigCreate): Promise<AgentConfig> {
    const response = await apiClient.post<AgentConfig>(API_ENDPOINTS.agents, data)
    return response.data
  }

  /**
   * Update existing agent
   */
  async updateAgent(id: string, data: AgentConfigUpdate): Promise<AgentConfig> {
    const response = await apiClient.put<AgentConfig>(`${API_ENDPOINTS.agents}/${id}`, data)
    return response.data
  }

  /**
   * Delete agent
   */
  async deleteAgent(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.agents}/${id}`)
  }

  /**
   * Get tasks assigned to agent
   */
  async getAgentTasks(agentId: string, activeOnly: boolean = false): Promise<AgentTaskAssignment[]> {
    const response = await apiClient.get<AgentTaskAssignment[]>(
      `${API_ENDPOINTS.agents}/${agentId}/tasks`,
      {
        params: {
          active_only: activeOnly || undefined,
        },
      }
    )
    return response.data
  }

  /**
   * Assign task to agent
   */
  async assignTask(
    agentId: string,
    data: Omit<AgentTaskAssignmentCreate, 'agent_id'>
  ): Promise<AgentTaskAssignment> {
    const response = await apiClient.post<AgentTaskAssignment>(
      `${API_ENDPOINTS.agents}/${agentId}/tasks`,
      { ...data, agent_id: agentId }
    )
    return response.data
  }

  /**
   * Unassign task from agent
   */
  async unassignTask(agentId: string, taskId: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.agents}/${agentId}/tasks/${taskId}`)
  }

  /**
   * Test agent with custom prompt
   */
  async testAgent(id: string, prompt: string): Promise<AgentTestResponse> {
    const response = await apiClient.post<AgentTestResponse>(
      `${API_ENDPOINTS.agents}/${id}/test`,
      { prompt }
    )
    return response.data
  }

  /**
   * List all agent-task assignments with detailed information
   */
  async listAllAssignments(params?: {
    active_only?: boolean
    skip?: number
    limit?: number
  }): Promise<AgentTaskAssignmentWithDetails[]> {
    const response = await apiClient.get<AgentTaskAssignmentWithDetails[]>('/api/v1/assignments', {
      params: {
        active_only: params?.active_only || undefined,
        skip: params?.skip,
        limit: params?.limit,
      },
    })
    return response.data
  }
}

export const agentService = new AgentService()
