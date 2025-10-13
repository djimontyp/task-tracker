/**
 * Project API Service
 */

import { API_ENDPOINTS } from '@/shared/config/api'
import type {
  ProjectConfig,
  CreateProjectConfig,
  UpdateProjectConfig,
  ProjectListResponse,
} from '../types'

const API_BASE_URL = ''

class ProjectService {
  /**
   * List all projects
   */
  async listProjects(): Promise<ProjectListResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.projects}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get single project by ID
   */
  async getProject(projectId: string): Promise<ProjectConfig> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.projects}/${projectId}`)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Project not found')
      }
      throw new Error(`Failed to fetch project: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create new project
   */
  async createProject(data: CreateProjectConfig): Promise<ProjectConfig> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.projects}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      if (response.status === 409) {
        throw new Error(error.detail || 'Project name already exists')
      }
      throw new Error(error.detail || 'Failed to create project')
    }

    return response.json()
  }

  /**
   * Update existing project
   */
  async updateProject(
    projectId: string,
    data: UpdateProjectConfig
  ): Promise<ProjectConfig> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.projects}/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      if (response.status === 404) {
        throw new Error('Project not found')
      }
      throw new Error(error.detail || 'Failed to update project')
    }

    return response.json()
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.projects}/${projectId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Project not found')
      }
      throw new Error(`Failed to delete project: ${response.statusText}`)
    }
  }
}

export const projectService = new ProjectService()
