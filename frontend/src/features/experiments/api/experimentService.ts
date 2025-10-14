/**
 * Experiments API Service
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import type {
  ExperimentPublic,
  ExperimentCreate,
  ExperimentDetailPublic,
  ExperimentListResponse,
  ExperimentFilters,
} from '../types'

interface Provider {
  id: string
  name: string
  type: string
  is_active: boolean
}

class ExperimentService {
  async startExperiment(data: ExperimentCreate): Promise<ExperimentPublic> {
    const response = await apiClient.post<ExperimentPublic>(
      API_ENDPOINTS.experiments.base,
      data
    )
    return response.data
  }

  async getExperiments(params?: ExperimentFilters): Promise<ExperimentListResponse> {
    const { data } = await apiClient.get<ExperimentListResponse>(
      API_ENDPOINTS.experiments.base,
      { params }
    )
    return data
  }

  async getExperimentDetails(id: number): Promise<ExperimentDetailPublic> {
    const { data } = await apiClient.get<ExperimentDetailPublic>(
      API_ENDPOINTS.experiments.detail(id)
    )
    return data
  }

  async deleteExperiment(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.experiments.detail(id))
  }

  async getProviders(): Promise<Provider[]> {
    const { data } = await apiClient.get<Provider[]>('/api/v1/providers')
    return data
  }
}

export const experimentService = new ExperimentService()

export const useExperiments = (params?: ExperimentFilters) => {
  return useQuery<ExperimentListResponse>({
    queryKey: ['experiments', params],
    queryFn: () => experimentService.getExperiments(params),
  })
}

export const useExperimentDetails = (id: number) => {
  return useQuery<ExperimentDetailPublic>({
    queryKey: ['experiment', id],
    queryFn: () => experimentService.getExperimentDetails(id),
    enabled: id > 0,
  })
}

export const useStartExperiment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ExperimentCreate) => experimentService.startExperiment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] })
    },
  })
}

export const useDeleteExperiment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => experimentService.deleteExperiment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] })
    },
  })
}

export const useProviders = () => {
  return useQuery<Provider[]>({
    queryKey: ['providers'],
    queryFn: () => experimentService.getProviders(),
    staleTime: 5 * 60 * 1000,
  })
}
