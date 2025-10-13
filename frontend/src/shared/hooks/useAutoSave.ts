import { useState, useEffect, useRef, useCallback } from 'react'
import { useDebounce } from './useDebounce'
import toast from 'react-hot-toast'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutoSaveOptions<T> {
  initialValues: T
  onSave: (values: T) => Promise<any>
  debounceMs?: number
  enabled?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

interface UseAutoSaveReturn<T> {
  values: T
  setValue: <K extends keyof T>(key: K, value: T[K]) => void
  setValues: (values: T) => void
  saveStatus: SaveStatus
  hasUnsavedChanges: boolean
  lastSavedAt: Date | null
  autoSaveEnabled: boolean
  setAutoSaveEnabled: (enabled: boolean) => void
  manualSave: () => Promise<void>
  discardChanges: () => void
  isSaving: boolean
  reset: () => void
}

export function useAutoSave<T extends Record<string, any>>({
  initialValues,
  onSave,
  debounceMs = 500,
  enabled = true,
  onSuccess,
  onError,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const initialValuesRef = useRef<T>(initialValues)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const isFirstRenderRef = useRef(true)

  const debouncedValues = useDebounce(values, debounceMs)

  useEffect(() => {
    initialValuesRef.current = initialValues
    setValuesState(initialValues)
    setIsInitialized(false)
    setHasUnsavedChanges(false)
    setSaveStatus('idle')
    isFirstRenderRef.current = true

    setTimeout(() => {
      setIsInitialized(true)
      setTimeout(() => {
        isFirstRenderRef.current = false
      }, 100)
    }, 50)
  }, [JSON.stringify(initialValues)])

  useEffect(() => {
    if (isInitialized && initialValuesRef.current) {
      const hasChanges = Object.keys(values).some(
        (key) => values[key] !== initialValuesRef.current[key]
      )

      if (hasChanges && !hasUnsavedChanges) {
        setHasUnsavedChanges(true)
        setSaveStatus('idle')
      }
    }
  }, [values, isInitialized, hasUnsavedChanges])

  const performSave = useCallback(
    async (valuesToSave: T) => {
      setIsSaving(true)
      setSaveStatus('saving')
      setHasUnsavedChanges(false)

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      try {
        const result = await onSave(valuesToSave)

        initialValuesRef.current = valuesToSave
        setHasUnsavedChanges(false)
        setSaveStatus('saved')
        setLastSavedAt(new Date())

        if (onSuccess) {
          onSuccess(result)
        }

        saveTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle')
        }, 2000)
      } catch (error) {
        setSaveStatus('error')
        setHasUnsavedChanges(true)
        const errorMessage = error instanceof Error ? error.message : 'Failed to save changes'
        toast.error(errorMessage)

        if (onError) {
          onError(error as Error)
        }
      } finally {
        setIsSaving(false)
      }
    },
    [onSave, onSuccess, onError]
  )

  useEffect(() => {
    if (
      enabled &&
      autoSaveEnabled &&
      !isFirstRenderRef.current &&
      isInitialized &&
      initialValuesRef.current
    ) {
      const hasChanges = Object.keys(debouncedValues).some(
        (key) => debouncedValues[key] !== initialValuesRef.current[key]
      )

      if (hasChanges) {
        performSave(debouncedValues)
      }
    }
  }, [debouncedValues, enabled, autoSaveEnabled, isInitialized, performSave])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValuesState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setValues = useCallback((newValues: T) => {
    setValuesState(newValues)
  }, [])

  const manualSave = useCallback(async () => {
    if (hasUnsavedChanges) {
      await performSave(values)
    }
  }, [hasUnsavedChanges, values, performSave])

  const discardChanges = useCallback(() => {
    setValuesState(initialValuesRef.current)
    setHasUnsavedChanges(false)
    setSaveStatus('idle')
  }, [])

  const reset = useCallback(() => {
    setValuesState(initialValuesRef.current)
    setHasUnsavedChanges(false)
    setSaveStatus('idle')
    setIsInitialized(false)
    isFirstRenderRef.current = true
  }, [])

  return {
    values,
    setValue,
    setValues,
    saveStatus,
    hasUnsavedChanges,
    lastSavedAt,
    autoSaveEnabled,
    setAutoSaveEnabled,
    manualSave,
    discardChanges,
    isSaving,
    reset,
  }
}
