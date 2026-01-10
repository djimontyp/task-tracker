/**
 * ProjectForm - Basic Info Section
 * Handles name, description, pm_user_id fields
 */

import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input, Textarea } from '@/shared/ui'
import { FormField } from '@/shared/patterns'
import type { ProjectBasicInfoSectionProps } from './types'

export function ProjectBasicInfoSection({
  control,
  errors,
}: ProjectBasicInfoSectionProps) {
  const { t } = useTranslation('projects')

  return (
    <>
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
    </>
  )
}
