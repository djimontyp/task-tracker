/**
 * Project API Service (shared version for hooks)
 *
 * This is a minimal version of projectService for use in shared hooks.
 * The full projectService with CRUD operations remains in features/projects/api.
 */

import { API_ENDPOINTS } from '@/shared/config/api'
import type { ProjectConfigListResponse } from './model/projectConfigListResponse'

const API_BASE_URL = ''

/**
 * List all projects (minimal version for shared hooks)
 */
export async function listProjects(): Promise<ProjectConfigListResponse> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.projects}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.statusText}`)
  }

  return response.json()
}
