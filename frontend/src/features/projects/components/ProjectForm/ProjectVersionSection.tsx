/**
 * ProjectForm - Version Section
 * Handles version field
 */

import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/shared/ui'
import { FormField } from '@/shared/patterns'
import type { Control } from 'react-hook-form'
import type { ProjectFormData } from './types'

interface ProjectVersionSectionProps {
  control: Control<ProjectFormData>
}

export function ProjectVersionSection({ control }: ProjectVersionSectionProps) {
  const { t } = useTranslation('projects')

  return (
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
  )
}
