/**
 * Project Form Component
 */

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Input,
  Textarea,
  Badge,
} from '@/shared/ui'
import { FormField } from '@/shared/patterns'
import { X } from 'lucide-react'
import type { ProjectConfig, CreateProjectConfig, ProjectComponent } from '../types'

// ═══════════════════════════════════════════════════════════════
// ZOD SCHEMA
// ═══════════════════════════════════════════════════════════════

const projectFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Назва проєкту обов\'язкова')
    .max(100, 'Назва занадто довга (макс. 100 символів)'),
  description: z.string().optional(),
  pm_user_id: z
    .number()
    .min(1, 'Оберіть PM (ID має бути >= 1)')
    .int('PM ID має бути цілим числом'),
  keywords: z.array(z.string()).optional(),
  components: z.array(
    z.object({
      name: z.string(),
      keywords: z.array(z.string()),
      description: z.string().optional(),
    })
  ).optional(),
  glossary: z.record(z.string()).optional(),
  default_assignee_ids: z.array(z.number().int()).optional(),
  priority_rules: z.object({
    critical_keywords: z.array(z.string()).optional(),
    high_keywords: z.array(z.string()).optional(),
    medium_keywords: z.array(z.string()).optional(),
    low_keywords: z.array(z.string()).optional(),
  }).optional(),
  version: z.string().optional(),
  is_active: z.boolean().optional(),
})

type ProjectFormData = z.infer<typeof projectFormSchema>

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

interface ProjectFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateProjectConfig) => void | Promise<void>
  project?: ProjectConfig
  isLoading?: boolean
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  project,
  isLoading,
}) => {
  const { t } = useTranslation('projects')

  // ─────────────────────────────────────────────────────────────
  // Local state for dynamic arrays/objects inputs
  // ─────────────────────────────────────────────────────────────
  const [keywordInput, setKeywordInput] = useState('')
  const [componentNameInput, setComponentNameInput] = useState('')
  const [componentKeywordsInput, setComponentKeywordsInput] = useState('')
  const [componentDescriptionInput, setComponentDescriptionInput] = useState('')
  const [assigneeInput, setAssigneeInput] = useState('')
  const [glossaryTermInput, setGlossaryTermInput] = useState('')
  const [glossaryDefinitionInput, setGlossaryDefinitionInput] = useState('')
  const [priorityInputs, setPriorityInputs] = useState({
    critical: '',
    high: '',
    medium: '',
    low: '',
  })

  // Manual errors for dynamic fields (keywords, components, etc)
  const [keywordsError, setKeywordsError] = useState<string | undefined>()

  // ─────────────────────────────────────────────────────────────
  // React Hook Form
  // ─────────────────────────────────────────────────────────────
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    setError,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      keywords: [],
      glossary: {},
      components: [],
      default_assignee_ids: [],
      pm_user_id: 0,
      is_active: true,
      priority_rules: undefined,
      version: '1.0.0',
    },
  })

  const formData = watch()

  // ─────────────────────────────────────────────────────────────
  // Initialize form when project changes
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description || '',
        keywords: project.keywords,
        glossary: project.glossary ?? {},
        components: project.components ?? [],
        default_assignee_ids: project.default_assignee_ids ?? [],
        pm_user_id: project.pm_user_id,
        is_active: project.is_active,
        priority_rules: project.priority_rules ?? undefined,
        version: project.version ?? '1.0.0',
      })
      setPriorityInputs({
        critical: (project.priority_rules?.critical_keywords ?? []).join(', '),
        high: (project.priority_rules?.high_keywords ?? []).join(', '),
        medium: (project.priority_rules?.medium_keywords ?? []).join(', '),
        low: (project.priority_rules?.low_keywords ?? []).join(', '),
      })
    } else {
      reset({
        name: '',
        description: '',
        keywords: [],
        glossary: {},
        components: [],
        default_assignee_ids: [],
        pm_user_id: 0,
        is_active: true,
        priority_rules: undefined,
        version: '1.0.0',
      })
      setPriorityInputs({ critical: '', high: '', medium: '', low: '' })
    }
    // Reset local inputs and errors
    setKeywordInput('')
    setComponentNameInput('')
    setComponentKeywordsInput('')
    setComponentDescriptionInput('')
    setAssigneeInput('')
    setGlossaryTermInput('')
    setGlossaryDefinitionInput('')
    setKeywordsError(undefined)
  }, [project, open, reset])

  // ─────────────────────────────────────────────────────────────
  // Keywords handlers
  // ─────────────────────────────────────────────────────────────
  const handleAddKeyword = () => {
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
    setKeywordsError(undefined) // Clear error when keyword added
  }

  const handleRemoveKeyword = (keyword: string) => {
    setValue('keywords', formData.keywords?.filter((k) => k !== keyword) || [])
  }

  // ─────────────────────────────────────────────────────────────
  // Components handlers
  // ─────────────────────────────────────────────────────────────
  const handleAddComponent = () => {
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
  }

  const handleRemoveComponent = (index: number) => {
    setValue('components', formData.components?.filter((_, i) => i !== index) || [])
  }

  // ─────────────────────────────────────────────────────────────
  // Assignees handlers
  // ─────────────────────────────────────────────────────────────
  const handleAddAssignee = () => {
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
  }

  const handleRemoveAssignee = (assigneeId: number) => {
    setValue(
      'default_assignee_ids',
      formData.default_assignee_ids?.filter((id) => id !== assigneeId) || []
    )
  }

  // ─────────────────────────────────────────────────────────────
  // Glossary handlers
  // ─────────────────────────────────────────────────────────────
  const handleAddGlossaryEntry = () => {
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
  }

  const handleRemoveGlossaryEntry = (term: string) => {
    const updatedGlossary = { ...(formData.glossary || {}) }
    delete updatedGlossary[term]
    setValue('glossary', updatedGlossary)
  }

  // ─────────────────────────────────────────────────────────────
  // Priority rules handlers
  // ─────────────────────────────────────────────────────────────
  const handlePriorityInputChange = (
    level: 'critical' | 'high' | 'medium' | 'low',
    value: string
  ) => {
    setPriorityInputs({ ...priorityInputs, [level]: value })

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
  }

  // ─────────────────────────────────────────────────────────────
  // Form submit
  // ─────────────────────────────────────────────────────────────
  const onFormSubmit = async (data: ProjectFormData) => {
    const submission: CreateProjectConfig = {
      name: data.name,
      description: data.description ?? '',
      keywords: data.keywords ?? [],
      components: data.components ?? [],
      glossary: data.glossary ?? {},
      default_assignee_ids: data.default_assignee_ids ?? [],
      pm_user_id: data.pm_user_id,
      is_active: data.is_active ?? true,
      priority_rules:
        data.priority_rules && Object.keys(data.priority_rules).length > 0
          ? data.priority_rules
          : undefined,
      version: data.version ?? '1.0.0',
    }

    try {
      const result = onSubmit(submission)
      // Check if result is a Promise
      if (result && typeof result === 'object' && 'then' in result) {
        await result
      }
    } catch (error: unknown) {
      // Handle Axios errors with server response
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
          let hasFieldErrors = false
          detail.forEach((err: { loc?: string[]; msg?: string; type?: string }) => {
            const field = err.loc?.[err.loc.length - 1]
            if (field && err.msg) {
              hasFieldErrors = true
              // Map server field names to form field names
              const fieldMap: Record<string, keyof ProjectFormData> = {
                'pm_user_id': 'pm_user_id',
                'name': 'name',
                'description': 'description',
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
        // String detail or message - try to map to specific field
        else if (typeof detail === 'string') {
          // Try to extract field from error message
          const detailLower = detail.toLowerCase()
          let fieldMapped = false

          // Common error patterns
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
        } else if (typeof message === 'string') {
          toast.error(message)
        }
        // Generic HTTP error
        else if (status) {
          toast.error(t('form.errors.serverError', { status }))
        } else {
          toast.error(t('form.errors.unknownServerError'))
        }
      }
      // Generic error
      else if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error(t('form.errors.unknownError'))
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] md:max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? t('form.title.edit') : t('form.title.create')}</DialogTitle>
          <DialogDescription>{t('form.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Name */}
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <FormField
                label={t('form.fields.name.label')}
                required
                error={errors.name?.message}
              >
                <Input
                  {...field}
                  id="name"
                  placeholder={t('form.fields.name.placeholder')}
                />
              </FormField>
            )}
          />

          {/* Description */}
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <FormField label={t('form.fields.description.label')}>
                <Textarea
                  {...field}
                  id="description"
                  placeholder={t('form.fields.description.placeholder')}
                  rows={3}
                />
              </FormField>
            )}
          />

          {/* PM User ID */}
          <Controller
            control={control}
            name="pm_user_id"
            render={({ field }) => (
              <FormField
                label={t('form.fields.pmUserId.label')}
                required
                error={errors.pm_user_id?.message}
              >
                <Input
                  {...field}
                  id="pm_user_id"
                  type="number"
                  min={1}
                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                />
              </FormField>
            )}
          />

          {/* Keywords */}
          <FormField
            label={t('form.fields.keywords.label')}
            error={keywordsError}
          >
            <div className="flex gap-2">
              <Input
                id="keywords"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddKeyword()
                  }
                }}
                placeholder={t('form.fields.keywords.placeholder')}
              />
              <Button type="button" onClick={handleAddKeyword} variant="outline">
                {t('form.actions.add')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.keywords?.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="ml-2 hover:text-destructive"
                    aria-label={t('form.actions.removeKeyword', { keyword })}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </FormField>

          {/* Components */}
          <div className="space-y-2">
            <Label>{t('form.fields.components.label')}</Label>
            <div className="flex flex-col gap-2">
              <Input
                id="component_name"
                value={componentNameInput}
                onChange={(e) => setComponentNameInput(e.target.value)}
                placeholder={t('form.fields.components.name.placeholder')}
              />
              <Input
                id="component_keywords"
                value={componentKeywordsInput}
                onChange={(e) => setComponentKeywordsInput(e.target.value)}
                placeholder={t('form.fields.components.keywords.placeholder')}
              />
              <Textarea
                id="component_description"
                value={componentDescriptionInput}
                onChange={(e) => setComponentDescriptionInput(e.target.value)}
                placeholder={t('form.fields.components.description.placeholder')}
                rows={2}
              />
              <div className="flex justify-end">
                <Button type="button" onClick={handleAddComponent} variant="outline">
                  {t('form.actions.addComponent')}
                </Button>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              {formData.components?.map((component, index) => (
                <div
                  key={`${component.name}-${index}`}
                  className="flex flex-col gap-2 rounded border p-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{component.name}</div>
                    <button
                      type="button"
                      onClick={() => handleRemoveComponent(index)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={t('form.actions.removeComponent', { name: component.name })}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {component.description && (
                    <div className="text-xs text-muted-foreground">{component.description}</div>
                  )}
                  {component.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {component.keywords.map((keyword, keywordIndex) => (
                        <Badge key={keywordIndex} variant="outline" className="text-2xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Assignees */}
          <FormField label={t('form.fields.assignees.label')}>
            <div className="flex gap-2">
              <Input
                value={assigneeInput}
                onChange={(e) => setAssigneeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddAssignee()
                  }
                }}
                placeholder={t('form.fields.assignees.placeholder')}
                type="number"
                min={1}
              />
              <Button type="button" onClick={handleAddAssignee} variant="outline">
                {t('form.actions.add')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.default_assignee_ids?.map((assigneeId) => (
                <Badge key={assigneeId} variant="outline" className="text-xs bg-accent/10">
                  {assigneeId}
                  <button
                    type="button"
                    onClick={() => handleRemoveAssignee(assigneeId)}
                    className="ml-2 hover:text-destructive"
                    aria-label={t('form.actions.removeAssignee', { id: assigneeId })}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </FormField>

          {/* Glossary */}
          <FormField label={t('form.fields.glossary.label')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                value={glossaryTermInput}
                onChange={(e) => setGlossaryTermInput(e.target.value)}
                placeholder={t('form.fields.glossary.term.placeholder')}
              />
              <Input
                value={glossaryDefinitionInput}
                onChange={(e) => setGlossaryDefinitionInput(e.target.value)}
                placeholder={t('form.fields.glossary.definition.placeholder')}
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={handleAddGlossaryEntry} variant="outline">
                {t('form.actions.addGlossaryEntry')}
              </Button>
            </div>
            <div className="space-y-2">
              {Object.entries(formData.glossary || {}).map(([term, definition]) => (
                <div key={term} className="flex items-start justify-between gap-2 text-sm">
                  <div>
                    <div className="font-medium">{term}</div>
                    <div className="text-muted-foreground">{definition}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGlossaryEntry(term)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={t('form.actions.removeGlossaryEntry', { term })}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </FormField>

          {/* Priority Rules */}
          <div className="space-y-2">
            <Label>{t('form.fields.priorityRules.label')}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="critical_keywords" className="text-xs">
                  {t('form.fields.priorityRules.critical')}
                </Label>
                <Input
                  id="critical_keywords"
                  value={priorityInputs.critical}
                  onChange={(e) => handlePriorityInputChange('critical', e.target.value)}
                  placeholder={t('form.fields.priorityRules.placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="high_keywords" className="text-xs">
                  {t('form.fields.priorityRules.high')}
                </Label>
                <Input
                  id="high_keywords"
                  value={priorityInputs.high}
                  onChange={(e) => handlePriorityInputChange('high', e.target.value)}
                  placeholder={t('form.fields.priorityRules.placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medium_keywords" className="text-xs">
                  {t('form.fields.priorityRules.medium')}
                </Label>
                <Input
                  id="medium_keywords"
                  value={priorityInputs.medium}
                  onChange={(e) => handlePriorityInputChange('medium', e.target.value)}
                  placeholder={t('form.fields.priorityRules.placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="low_keywords" className="text-xs">
                  {t('form.fields.priorityRules.low')}
                </Label>
                <Input
                  id="low_keywords"
                  value={priorityInputs.low}
                  onChange={(e) => handlePriorityInputChange('low', e.target.value)}
                  placeholder={t('form.fields.priorityRules.placeholder')}
                />
              </div>
            </div>
          </div>

          {/* Version */}
          <Controller
            control={control}
            name="version"
            render={({ field }) => (
              <FormField label={t('form.fields.version.label')}>
                <Input
                  {...field}
                  id="version"
                  placeholder={t('form.fields.version.placeholder')}
                />
              </FormField>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('form.actions.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? t('form.actions.saving')
                : project
                  ? t('form.actions.update')
                  : t('form.actions.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
