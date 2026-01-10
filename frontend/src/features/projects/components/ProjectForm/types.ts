/**
 * ProjectForm shared types
 */

import * as z from 'zod'
import type { ProjectConfig, CreateProjectConfig, ProjectComponent, PriorityRules } from '../../types'

// ═══════════════════════════════════════════════════════════════
// ZOD SCHEMA
// ═══════════════════════════════════════════════════════════════

export const projectFormSchema = z.object({
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

export type ProjectFormData = z.infer<typeof projectFormSchema>

// ═══════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════

export interface ProjectFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateProjectConfig) => void | Promise<void>
  project?: ProjectConfig
  isLoading?: boolean
}

export interface ProjectBasicInfoSectionProps {
  control: import('react-hook-form').Control<ProjectFormData>
  errors: import('react-hook-form').FieldErrors<ProjectFormData>
}

export interface ProjectKeywordsSectionProps {
  keywords: string[]
  keywordInput: string
  setKeywordInput: (value: string) => void
  onAddKeyword: () => void
  onRemoveKeyword: (keyword: string) => void
  error?: string
}

export interface ProjectComponentsSectionProps {
  components: ProjectComponent[]
  componentNameInput: string
  componentKeywordsInput: string
  componentDescriptionInput: string
  setComponentNameInput: (value: string) => void
  setComponentKeywordsInput: (value: string) => void
  setComponentDescriptionInput: (value: string) => void
  onAddComponent: () => void
  onRemoveComponent: (index: number) => void
}

export interface ProjectAssigneesSectionProps {
  assigneeIds: number[]
  assigneeInput: string
  setAssigneeInput: (value: string) => void
  onAddAssignee: () => void
  onRemoveAssignee: (assigneeId: number) => void
}

export interface ProjectGlossarySectionProps {
  glossary: Record<string, string>
  glossaryTermInput: string
  glossaryDefinitionInput: string
  setGlossaryTermInput: (value: string) => void
  setGlossaryDefinitionInput: (value: string) => void
  onAddGlossaryEntry: () => void
  onRemoveGlossaryEntry: (term: string) => void
}

export interface ProjectPriorityRulesSectionProps {
  priorityInputs: PriorityInputs
  onPriorityInputChange: (level: PriorityLevel, value: string) => void
}

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low'

export interface PriorityInputs {
  critical: string
  high: string
  medium: string
  low: string
}

// ═══════════════════════════════════════════════════════════════
// FORM HANDLERS HOOK RETURN TYPE
// ═══════════════════════════════════════════════════════════════

export interface UseProjectFormHandlersReturn {
  // Keywords
  keywordInput: string
  setKeywordInput: (value: string) => void
  handleAddKeyword: () => void
  handleRemoveKeyword: (keyword: string) => void
  keywordsError: string | undefined
  setKeywordsError: (error: string | undefined) => void

  // Components
  componentNameInput: string
  componentKeywordsInput: string
  componentDescriptionInput: string
  setComponentNameInput: (value: string) => void
  setComponentKeywordsInput: (value: string) => void
  setComponentDescriptionInput: (value: string) => void
  handleAddComponent: () => void
  handleRemoveComponent: (index: number) => void

  // Assignees
  assigneeInput: string
  setAssigneeInput: (value: string) => void
  handleAddAssignee: () => void
  handleRemoveAssignee: (assigneeId: number) => void

  // Glossary
  glossaryTermInput: string
  glossaryDefinitionInput: string
  setGlossaryTermInput: (value: string) => void
  setGlossaryDefinitionInput: (value: string) => void
  handleAddGlossaryEntry: () => void
  handleRemoveGlossaryEntry: (term: string) => void

  // Priority rules
  priorityInputs: PriorityInputs
  handlePriorityInputChange: (level: PriorityLevel, value: string) => void

  // Reset
  resetAllInputs: () => void
  initializePriorityInputs: (rules: PriorityRules | undefined) => void
}
