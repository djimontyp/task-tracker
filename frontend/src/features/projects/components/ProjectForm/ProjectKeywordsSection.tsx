/**
 * ProjectForm - Keywords Section
 * Handles keywords add/remove functionality
 */

import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Input, Button, Badge } from '@/shared/ui'
import { FormField } from '@/shared/patterns'
import type { ProjectKeywordsSectionProps } from './types'

export function ProjectKeywordsSection({
  keywords,
  keywordInput,
  setKeywordInput,
  onAddKeyword,
  onRemoveKeyword,
  error,
}: ProjectKeywordsSectionProps) {
  const { t } = useTranslation('projects')

  return (
    <FormField label={t('form.fields.keywords.label')} error={error}>
      <div className="flex gap-2">
        <Input
          id="keywords"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAddKeyword()
            }
          }}
          placeholder={t('form.fields.keywords.placeholder')}
        />
        <Button type="button" onClick={onAddKeyword} variant="outline">
          {t('form.actions.add')}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {keywords.map((keyword, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {keyword}
            <button
              type="button"
              onClick={() => onRemoveKeyword(keyword)}
              className="ml-2 hover:text-destructive"
              aria-label={t('form.actions.removeKeyword', { keyword })}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </FormField>
  )
}
