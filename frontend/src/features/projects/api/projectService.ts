/**
 * Project API Service
 *
 * Uses axios client for HTTP requests with automatic JSON parsing
 */

import apiClient from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import type {
  ProjectConfig,
  CreateProjectConfig,
  UpdateProjectConfig,
  ProjectListResponse,
} from '../types'

class ProjectService {
  /**
   * List all projects
   */
  async listProjects(): Promise<ProjectListResponse> {
    const response = await apiClient.get<ProjectListResponse>(API_ENDPOINTS.projects)
    return response.data
  }

  /**
   * Get single project by ID
   */
  async getProject(projectId: string): Promise<ProjectConfig> {
    const response = await apiClient.get<ProjectConfig>(`${API_ENDPOINTS.projects}/${projectId}`)
    return response.data
  }

  /**
   * Create new project
   */
  async createProject(data: CreateProjectConfig): Promise<ProjectConfig> {
    const response = await apiClient.post<ProjectConfig>(API_ENDPOINTS.projects, data)
    return response.data
  }

  /**
   * Update existing project
   */
  async updateProject(
    projectId: string,
    data: UpdateProjectConfig
  ): Promise<ProjectConfig> {
    const response = await apiClient.put<ProjectConfig>(
      `${API_ENDPOINTS.projects}/${projectId}`,
      data
    )
    return response.data
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.projects}/${projectId}`)
  }
}

export const projectService = new ProjectService()
