import { useQuery } from '@tanstack/react-query'
import { providerService } from '../api/providerService'

/**
 * Hook to fetch Gemini models for a configured provider.
 *
 * @param providerId - UUID of the Gemini provider
 * @returns Query result with Gemini models
 */
export function useGeminiModels(providerId: string | undefined) {
  return useQuery({
    queryKey: ['gemini-models', providerId],
    queryFn: () => providerService.fetchGeminiModels(providerId!),
    enabled: !!providerId,
    staleTime: 5 * 60 * 1000,
  })
}
