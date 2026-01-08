import { useState, useCallback, useRef } from 'react'
import { API_ENDPOINTS } from '@/shared/config/api'

interface StreamingTestResult {
  streamedText: string
  finalResult: string | null
  isStreaming: boolean
  error: string | null
  elapsedSeconds: number
}

interface UseStreamingTestReturn extends StreamingTestResult {
  startStream: (agentId: string, prompt: string) => Promise<void>
  cancelStream: () => void
  reset: () => void
}

/**
 * Hook for handling SSE streaming from agent test endpoint.
 * Provides real-time text display with cursor animation support.
 */
export function useStreamingTest(): UseStreamingTestReturn {
  const [streamedText, setStreamedText] = useState('')
  const [finalResult, setFinalResult] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startStream = useCallback(async (agentId: string, prompt: string) => {
    // Reset state
    setStreamedText('')
    setFinalResult(null)
    setError(null)
    setIsStreaming(true)
    setElapsedSeconds(0)

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)

    // Create abort controller
    abortRef.current = new AbortController()

    try {
      const response = await fetch(API_ENDPOINTS.agentTestStream(agentId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      let done = false

      while (!done) {
        const result = await reader.read()
        done = result.done
        if (done) break

        const value = result.value

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || '' // Keep incomplete chunk in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'text' && data.content) {
                setStreamedText(prev => prev + data.content)
              } else if (data.type === 'complete' && data.content) {
                setFinalResult(data.content)
              } else if (data.type === 'error') {
                setError(data.content || 'Unknown error')
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError)
            }
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setError(e.message)
      }
    } finally {
      setIsStreaming(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const cancelStream = useCallback(() => {
    abortRef.current?.abort()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const reset = useCallback(() => {
    cancelStream()
    setStreamedText('')
    setFinalResult(null)
    setError(null)
    setElapsedSeconds(0)
  }, [cancelStream])

  return {
    streamedText,
    finalResult,
    isStreaming,
    error,
    elapsedSeconds,
    startStream,
    cancelStream,
    reset,
  }
}
