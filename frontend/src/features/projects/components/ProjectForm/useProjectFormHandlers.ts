/**
 * Custom hook for ProjectForm handlers
 * Extracts all dynamic field management logic from the main form component
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { UseFormSetValue, UseFormWatch } from 'react-hook-form'
import type {
  ProjectFormData,
  PriorityLevel,
  PriorityInputs,
  UseProjectFormHandlersReturn,
} from './types'
import type { ProjectComponent, PriorityRules } from '../../types'

interface UseProjectFormHandlersProps {
  setValue: UseFormSetValue<ProjectFormData>
  watch: UseFormWatch<ProjectFormData>
}

export function useProjectFormHandlers({
  setValue,
  watch,
}: UseProjectFormHandlersProps): UseProjectFormHandlersReturn {
  const { t } = useTranslation('projects')
  const formData = watch()

  // ─────────────────────────────────────────────────────────────
  // Keywords state & handlers
  // ─────────────────────────────────────────────────────────────
  const [keywordInput, setKeywordInput] = useState('')
  const [keywordsError, setKeywordsError] = useState<string | undefined>()

  const handleAddKeyword = useCallback(() => {
    const trimmed = keywordInput.trim()
    if (!trimmed) {
      toast.error(t('form.validation.keywordEmpty'))
      return
    }
    if (formData.keywords?.includes(trimmed)) {
      toast.warning(t('form.validation.keywordDuplicate'))
      return
    }
    setValue('keywords', [...(formData.keywords || []), trimmed])
    setKeywordInput('')
    setKeywordsError(undefined)
  }, [keywordInput, formData.keywords, setValue, t])

  const handleRemoveKeyword = useCallback(
    (keyword: string) => {
      setValue('keywords', formData.keywords?.filter((k) => k !== keyword) || [])
    },
    [formData.keywords, setValue]
  )

  // ─────────────────────────────────────────────────────────────
  // Components state & handlers
  // ─────────────────────────────────────────────────────────────
  const [componentNameInput, setComponentNameInput] = useState('')
  const [componentKeywordsInput, setComponentKeywordsInput] = useState('')
  const [componentDescriptionInput, setComponentDescriptionInput] = useState('')

  const handleAddComponent = useCallback(() => {
    const trimmedName = componentNameInput.trim()
    if (!trimmedName) {
      toast.error(t('form.validation.componentNameRequired'))
      return
    }

    const keywords = componentKeywordsInput
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean)

    const newComponent: ProjectComponent = {
      name: trimmedName,
      keywords,
      description: componentDescriptionInput.trim() || undefined,
    }

    setValue('components', [...(formData.components || []), newComponent])
    setComponentNameInput('')
    setComponentKeywordsInput('')
    setComponentDescriptionInput('')
    toast.success(t('form.validation.componentAdded', { name: trimmedName }))
  }, [
    componentNameInput,
    componentKeywordsInput,
    componentDescriptionInput,
    formData.components,
    setValue,
    t,
  ])

  const handleRemoveComponent = useCallback(
    (index: number) => {
      setValue('components', formData.components?.filter((_, i) => i !== index) || [])
    },
    [formData.components, setValue]
  )

  // ─────────────────────────────────────────────────────────────
  // Assignees state & handlers
  // ─────────────────────────────────────────────────────────────
  const [assigneeInput, setAssigneeInput] = useState('')

  const handleAddAssignee = useCallback(() => {
    const trimmed = assigneeInput.trim()
    if (!trimmed) {
      toast.error(t('form.validation.assigneeEmpty'))
      return
    }
    const numericValue = Number(trimmed)
    if (Number.isNaN(numericValue) || numericValue < 1) {
      toast.error(t('form.validation.assigneeInvalid'))
      return
    }
    if (formData.default_assignee_ids?.includes(numericValue)) {
      toast.warning(t('form.validation.assigneeDuplicate'))
      return
    }
    setValue('default_assignee_ids', [...(formData.default_assignee_ids || []), numericValue])
    setAssigneeInput('')
  }, [assigneeInput, formData.default_assignee_ids, setValue, t])

  const handleRemoveAssignee = useCallback(
    (assigneeId: number) => {
      setValue(
        'default_assignee_ids',
        formData.default_assignee_ids?.filter((id) => id !== assigneeId) || []
      )
    },
    [formData.default_assignee_ids, setValue]
  )

  // ─────────────────────────────────────────────────────────────
  // Glossary state & handlers
  // ─────────────────────────────────────────────────────────────
  const [glossaryTermInput, setGlossaryTermInput] = useState('')
  const [glossaryDefinitionInput, setGlossaryDefinitionInput] = useState('')

  const handleAddGlossaryEntry = useCallback(() => {
    const trimmedTerm = glossaryTermInput.trim()
    const trimmedDef = glossaryDefinitionInput.trim()

    if (!trimmedTerm || !trimmedDef) {
      toast.error(t('form.validation.glossaryRequired'))
      return
    }

    setValue('glossary', {
      ...(formData.glossary || {}),
      [trimmedTerm]: trimmedDef,
    })
    setGlossaryTermInput('')
    setGlossaryDefinitionInput('')
    toast.success(t('form.validation.glossaryAdded', { term: trimmedTerm }))
  }, [glossaryTermInput, glossaryDefinitionInput, formData.glossary, setValue, t])

  const handleRemoveGlossaryEntry = useCallback(
    (term: string) => {
      const updatedGlossary = { ...(formData.glossary || {}) }
      delete updatedGlossary[term]
      setValue('glossary', updatedGlossary)
    },
    [formData.glossary, setValue]
  )

  // ─────────────────────────────────────────────────────────────
  // Priority rules state & handlers
  // ─────────────────────────────────────────────────────────────
  const [priorityInputs, setPriorityInputs] = useState<PriorityInputs>({
    critical: '',
    high: '',
    medium: '',
    low: '',
  })

  const handlePriorityInputChange = useCallback(
    (level: PriorityLevel, value: string) => {
      setPriorityInputs((prev) => ({ ...prev, [level]: value }))

      const keyMap = {
        critical: 'critical_keywords' as const,
        high: 'high_keywords' as const,
        medium: 'medium_keywords' as const,
        low: 'low_keywords' as const,
      }

      const keywords = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      const currentRules = formData.priority_rules || {}
      setValue('priority_rules', {
        ...currentRules,
        [keyMap[level]]: keywords.length > 0 ? keywords : undefined,
      })
    },
    [formData.priority_rules, setValue]
  )

  const initializePriorityInputs = useCallback((rules: PriorityRules | undefined) => {
    setPriorityInputs({
      critical: (rules?.critical_keywords ?? []).join(', '),
      high: (rules?.high_keywords ?? []).join(', '),
      medium: (rules?.medium_keywords ?? []).join(', '),
      low: (rules?.low_keywords ?? []).join(', '),
    })
  }, [])

  // ─────────────────────────────────────────────────────────────
  // Reset all inputs
  // ─────────────────────────────────────────────────────────────
  const resetAllInputs = useCallback(() => {
    setKeywordInput('')
    setKeywordsError(undefined)
    setComponentNameInput('')
    setComponentKeywordsInput('')
    setComponentDescriptionInput('')
    setAssigneeInput('')
    setGlossaryTermInput('')
    setGlossaryDefinitionInput('')
    setPriorityInputs({ critical: '', high: '', medium: '', low: '' })
  }, [])

  return {
    // Keywords
    keywordInput,
    setKeywordInput,
    handleAddKeyword,
    handleRemoveKeyword,
    keywordsError,
    setKeywordsError,

    // Components
    componentNameInput,
    componentKeywordsInput,
    componentDescriptionInput,
    setComponentNameInput,
    setComponentKeywordsInput,
    setComponentDescriptionInput,
    handleAddComponent,
    handleRemoveComponent,

    // Assignees
    assigneeInput,
    setAssigneeInput,
    handleAddAssignee,
    handleRemoveAssignee,

    // Glossary
    glossaryTermInput,
    glossaryDefinitionInput,
    setGlossaryTermInput,
    setGlossaryDefinitionInput,
    handleAddGlossaryEntry,
    handleRemoveGlossaryEntry,

    // Priority rules
    priorityInputs,
    handlePriorityInputChange,

    // Reset
    resetAllInputs,
    initializePriorityInputs,
  }
}
