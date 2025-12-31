/**
 * Task API Service
 *
 * Uses axios client for HTTP requests with automatic JSON parsing
 */

import apiClient from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import type {
  TaskConfig,
  TaskConfigCreate,
  TaskConfigUpdate,
} from '../types'

interface ListTasksParams {
  skip?: number
  limit?: number
  active_only?: boolean
}

class TaskService {
  /**
   * List all tasks with optional filters
   */
  async listTasks(params?: ListTasksParams): Promise<TaskConfig[]> {
    const response = await apiClient.get<TaskConfig[]>(API_ENDPOINTS.taskConfigs, {
      params: {
        skip: params?.skip,
        limit: params?.limit,
        active_only: params?.active_only || undefined,
      },
    })
    return response.data
  }

  /**
   * Get single task by ID
   */
  async getTask(id: string): Promise<TaskConfig> {
    const response = await apiClient.get<TaskConfig>(`${API_ENDPOINTS.taskConfigs}/${id}`)
    return response.data
  }

  /**
   * Create new task
   */
  async createTask(data: TaskConfigCreate): Promise<TaskConfig> {
    const response = await apiClient.post<TaskConfig>(API_ENDPOINTS.taskConfigs, data)
    return response.data
  }

  /**
   * Update existing task
   */
  async updateTask(id: string, data: TaskConfigUpdate): Promise<TaskConfig> {
    const response = await apiClient.put<TaskConfig>(
      `${API_ENDPOINTS.taskConfigs}/${id}`,
      data
    )
    return response.data
  }

  /**
   * Delete task
   */
  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.taskConfigs}/${id}`)
  }
}

export const taskService = new TaskService()
