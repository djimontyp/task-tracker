/**
 * Project Form Component
 * Refactored into smaller focused sections
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from '@/shared/ui'

import { projectFormSchema, type ProjectFormData, type ProjectFormProps } from './types'
import { useProjectFormHandlers } from './useProjectFormHandlers'
import { handleSubmitError } from './utils'
import { ProjectBasicInfoSection } from './ProjectBasicInfoSection'
import { ProjectKeywordsSection } from './ProjectKeywordsSection'
import { ProjectComponentsSection } from './ProjectComponentsSection'
import { ProjectAssigneesSection } from './ProjectAssigneesSection'
import { ProjectGlossarySection } from './ProjectGlossarySection'
import { ProjectPriorityRulesSection } from './ProjectPriorityRulesSection'
import { ProjectVersionSection } from './ProjectVersionSection'
import type { CreateProjectConfig } from '../../types'

const DEFAULT_VALUES: ProjectFormData = {
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
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  project,
  isLoading,
}) => {
  const { t } = useTranslation('projects')

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
    defaultValues: DEFAULT_VALUES,
  })

  const formData = watch()
  const handlers = useProjectFormHandlers({ setValue, watch })

  // Initialize form when project changes
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
      handlers.initializePriorityInputs(project.priority_rules)
    } else {
      reset(DEFAULT_VALUES)
      handlers.initializePriorityInputs(undefined)
    }
    handlers.resetAllInputs()
    // Use specific stable callbacks instead of entire handlers object
  }, [project, open, reset, handlers.initializePriorityInputs, handlers.resetAllInputs])

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
      if (result && typeof result === 'object' && 'then' in result) {
        await result
      }
    } catch (error: unknown) {
      handleSubmitError(error, setError, handlers.setKeywordsError, t)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] md:max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? t('form.title.edit') : t('form.title.create')}</DialogTitle>
          <DialogDescription>{t('form.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <ProjectBasicInfoSection control={control} errors={errors} />

          <ProjectKeywordsSection
            keywords={formData.keywords ?? []}
            keywordInput={handlers.keywordInput}
            setKeywordInput={handlers.setKeywordInput}
            onAddKeyword={handlers.handleAddKeyword}
            onRemoveKeyword={handlers.handleRemoveKeyword}
            error={handlers.keywordsError}
          />

          <ProjectComponentsSection
            components={formData.components ?? []}
            componentNameInput={handlers.componentNameInput}
            componentKeywordsInput={handlers.componentKeywordsInput}
            componentDescriptionInput={handlers.componentDescriptionInput}
            setComponentNameInput={handlers.setComponentNameInput}
            setComponentKeywordsInput={handlers.setComponentKeywordsInput}
            setComponentDescriptionInput={handlers.setComponentDescriptionInput}
            onAddComponent={handlers.handleAddComponent}
            onRemoveComponent={handlers.handleRemoveComponent}
          />

          <ProjectAssigneesSection
            assigneeIds={formData.default_assignee_ids ?? []}
            assigneeInput={handlers.assigneeInput}
            setAssigneeInput={handlers.setAssigneeInput}
            onAddAssignee={handlers.handleAddAssignee}
            onRemoveAssignee={handlers.handleRemoveAssignee}
          />

          <ProjectGlossarySection
            glossary={formData.glossary ?? {}}
            glossaryTermInput={handlers.glossaryTermInput}
            glossaryDefinitionInput={handlers.glossaryDefinitionInput}
            setGlossaryTermInput={handlers.setGlossaryTermInput}
            setGlossaryDefinitionInput={handlers.setGlossaryDefinitionInput}
            onAddGlossaryEntry={handlers.handleAddGlossaryEntry}
            onRemoveGlossaryEntry={handlers.handleRemoveGlossaryEntry}
          />

          <ProjectPriorityRulesSection
            priorityInputs={handlers.priorityInputs}
            onPriorityInputChange={handlers.handlePriorityInputChange}
          />

          <ProjectVersionSection control={control} />

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

// Re-export types for external use
export type { ProjectFormProps, ProjectFormData } from './types'
