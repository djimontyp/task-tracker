/**
 * LLM Provider Types
 *
 * TypeScript interfaces matching backend LLMProvider models
 */

export enum ProviderType {
  OLLAMA = "ollama",
  OPENAI = "openai",
}

export enum ValidationStatus {
  PENDING = "pending",
  VALIDATING = "validating",
  CONNECTED = "connected",
  ERROR = "error",
}

export interface LLMProvider {
  id: string;
  name: string;
  type: ProviderType;
  base_url?: string;
  // Note: api_key_encrypted is NOT included in responses
  is_active: boolean;
  validation_status: ValidationStatus;
  validation_error?: string;
  validated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LLMProviderCreate {
  name: string;
  type: ProviderType;
  base_url?: string;
  api_key?: string; // Plain text, will be encrypted by backend
  is_active?: boolean;
}

export interface LLMProviderUpdate {
  name?: string;
  type?: ProviderType;
  base_url?: string;
  api_key?: string; // Plain text, will be encrypted by backend
  is_active?: boolean;
}

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

export interface OllamaModelsResponse {
  models: OllamaModel[];
}

export interface OllamaModelsErrorResponse {
  detail: string;
}
