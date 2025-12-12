/**
 * Custom axios instance for orval-generated hooks.
 * This mutator wraps the apiClient to work with orval's generated code.
 */
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { apiClient } from './client'

/**
 * Custom mutator for orval that uses our configured apiClient.
 */
export const customInstance = async <T>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.request<T>(config)
}

export default customInstance
