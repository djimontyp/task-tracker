import { useState, useEffect, useCallback } from 'react'
import { providerService } from '../api/providerService'
import { OllamaModel } from '../types'

interface UseOllamaModelsResult {
  models: OllamaModel[]
  isLoading: boolean
  error: string | null
  triggerFetch: () => void
  hasFetched: boolean
}

const isValidUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Hook to fetch Ollama models with optional lazy loading.
 *
 * @param host - Ollama server URL
 * @param enabled - Whether fetching is enabled
 * @param fetchOnMount - If false, models won't load until triggerFetch() is called
 */
export const useOllamaModels = (
  host: string,
  enabled: boolean = true,
  fetchOnMount: boolean = true
): UseOllamaModelsResult => {
  const [models, setModels] = useState<OllamaModel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shouldFetch, setShouldFetch] = useState(fetchOnMount)

  const triggerFetch = useCallback(() => {
    setShouldFetch(true)
  }, [])

  useEffect(() => {
    if (!enabled || !shouldFetch || !isValidUrl(host)) {
      if (!shouldFetch) return
      setModels([])
      setError(null)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    const fetchModels = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await providerService.fetchOllamaModels(host)
        if (!controller.signal.aborted) {
          setModels(response.models)
          setError(null)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models'
          setError(errorMessage)
          setModels([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    const timeoutId = setTimeout(() => {
      fetchModels()
    }, 500)

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [host, enabled, shouldFetch])

  return { models, isLoading, error, triggerFetch, hasFetched: shouldFetch }
}
