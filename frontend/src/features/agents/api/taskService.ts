/**
 * Task API Service
 *
 * Client for task configuration endpoints
 */

import {
  TaskConfig,
  TaskConfigCreate,
  TaskConfigUpdate,
} from "../types";
import { API_ENDPOINTS } from "@/shared/config/api";

const API_BASE_URL = '';

class TaskService {
  /**
   * List all tasks with optional filters
   */
  async listTasks(params?: {
    skip?: number;
    limit?: number;
    active_only?: boolean;
  }): Promise<TaskConfig[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.set("skip", params.skip.toString());
    if (params?.limit !== undefined) queryParams.set("limit", params.limit.toString());
    if (params?.active_only) queryParams.set("active_only", "true");

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.taskConfigs}?${queryParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get single task by ID
   */
  async getTask(id: string): Promise<TaskConfig> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.taskConfigs}/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Task not found");
      }
      throw new Error(`Failed to fetch task: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create new task
   */
  async createTask(data: TaskConfigCreate): Promise<TaskConfig> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.taskConfigs}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      if (response.status === 409) {
        throw new Error("Task name already exists");
      }
      if (response.status === 400) {
        throw new Error(error.detail || "Invalid schema or configuration");
      }
      throw new Error(error.detail || "Failed to create task");
    }

    return response.json();
  }

  /**
   * Update existing task
   */
  async updateTask(id: string, data: TaskConfigUpdate): Promise<TaskConfig> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.taskConfigs}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      if (response.status === 404) {
        throw new Error("Task not found");
      }
      if (response.status === 400) {
        throw new Error(error.detail || "Invalid schema or update data");
      }
      throw new Error(error.detail || "Failed to update task");
    }

    return response.json();
  }

  /**
   * Delete task
   */
  async deleteTask(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.taskConfigs}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Task not found");
      }
      throw new Error(`Failed to delete task: ${response.statusText}`);
    }
  }
}

export const taskService = new TaskService();
