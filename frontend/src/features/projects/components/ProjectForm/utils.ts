/**
 * ProjectForm utility functions
 */

import { toast } from 'sonner'
import type { ProjectFormData } from './types'

type SetErrorFn = (name: keyof ProjectFormData, error: { message: string }) => void
type SetKeywordsErrorFn = (error: string | undefined) => void
type TranslateFn = (key: string, options?: Record<string, unknown>) => string

/**
 * Handles form submission errors from the API
 * Maps server errors to form fields where possible
 */
export function handleSubmitError(
  error: unknown,
  setError: SetErrorFn,
  setKeywordsError: SetKeywordsErrorFn,
  t: TranslateFn
): void {
  if (error && typeof error === 'object' && 'response' in error) {
    const responseError = error as {
      response?: {
        data?: {
          detail?: unknown
          message?: string
        }
        status?: number
      }
    }
    const detail = responseError.response?.data?.detail
    const message = responseError.response?.data?.message
    const status = responseError.response?.status

    // FastAPI/Pydantic validation errors (422)
    if (Array.isArray(detail)) {
      handleValidationErrors(detail, setError, t)
    } else if (typeof detail === 'string') {
      handleStringError(detail, setError, setKeywordsError, t)
    } else if (typeof message === 'string') {
      toast.error(message)
    } else if (status) {
      toast.error(t('form.errors.serverError', { status }))
    } else {
      toast.error(t('form.errors.unknownServerError'))
    }
  } else if (error instanceof Error) {
    toast.error(error.message)
  } else {
    toast.error(t('form.errors.unknownError'))
  }
}

function handleValidationErrors(
  detail: Array<{ loc?: string[]; msg?: string; type?: string }>,
  setError: SetErrorFn,
  t: TranslateFn
): void {
  let hasFieldErrors = false

  detail.forEach((err) => {
    const field = err.loc?.[err.loc.length - 1]
    if (field && err.msg) {
      hasFieldErrors = true
      const fieldMap: Record<string, keyof ProjectFormData> = {
        pm_user_id: 'pm_user_id',
        name: 'name',
        description: 'description',
      }
      const formField = fieldMap[field]
      if (formField) {
        setError(formField, { message: err.msg })
      }
    }
  })

  if (hasFieldErrors) {
    toast.error(t('form.errors.fixErrors'))
  } else {
    toast.error(t('form.errors.validationFailed'))
  }
}

function handleStringError(
  detail: string,
  setError: SetErrorFn,
  setKeywordsError: SetKeywordsErrorFn,
  t: TranslateFn
): void {
  const detailLower = detail.toLowerCase()
  let fieldMapped = false

  if (detailLower.includes('keyword') || detailLower.includes('keywords')) {
    setKeywordsError(detail)
    fieldMapped = true
  } else if (detailLower.includes('name') && detailLower.includes('already exists')) {
    setError('name', { message: detail })
    fieldMapped = true
  } else if (detailLower.includes('pm') || detailLower.includes('manager')) {
    setError('pm_user_id', { message: detail })
    fieldMapped = true
  } else if (detailLower.includes('description')) {
    setError('description', { message: detail })
    fieldMapped = true
  }

  if (fieldMapped) {
    toast.error(t('form.errors.fixErrors'))
  } else {
    toast.error(detail)
  }
}
