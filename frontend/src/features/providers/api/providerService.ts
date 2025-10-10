/**
 * Provider API Service
 *
 * Client for LLM provider configuration endpoints
 */

import {
  LLMProvider,
  LLMProviderCreate,
  LLMProviderUpdate,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
import { API_ENDPOINTS } from "@/shared/config/api";

class ProviderService {
  /**
   * List all providers with optional filters
   */
  async listProviders(params?: {
    skip?: number;
    limit?: number;
    active_only?: boolean;
  }): Promise<LLMProvider[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.set("skip", params.skip.toString());
    if (params?.limit !== undefined) queryParams.set("limit", params.limit.toString());
    if (params?.active_only) queryParams.set("active_only", "true");

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.providers}?${queryParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch providers: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get single provider by ID
   */
  async getProvider(id: string): Promise<LLMProvider> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.providers}/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Provider not found");
      }
      throw new Error(`Failed to fetch provider: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create new provider
   */
  async createProvider(data: LLMProviderCreate): Promise<LLMProvider> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.providers}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      if (response.status === 409) {
        throw new Error("Provider name already exists");
      }
      throw new Error(error.detail || "Failed to create provider");
    }

    return response.json();
  }

  /**
   * Update existing provider
   */
  async updateProvider(
    id: string,
    data: LLMProviderUpdate
  ): Promise<LLMProvider> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.providers}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      if (response.status === 404) {
        throw new Error("Provider not found");
      }
      throw new Error(error.detail || "Failed to update provider");
    }

    return response.json();
  }

  /**
   * Delete provider
   */
  async deleteProvider(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.providers}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      if (response.status === 409) {
        throw new Error("Cannot delete - provider is referenced by agents");
      }
      if (response.status === 404) {
        throw new Error("Provider not found");
      }
      throw new Error(error.detail || "Failed to delete provider");
    }
  }
}

export const providerService = new ProviderService();
