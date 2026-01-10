/**
 * ProjectForm - Glossary Section
 * Handles glossary entries (term -> definition)
 */

import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Input, Button } from '@/shared/ui'
import { FormField } from '@/shared/patterns'
import type { ProjectGlossarySectionProps } from './types'

export function ProjectGlossarySection({
  glossary,
  glossaryTermInput,
  glossaryDefinitionInput,
  setGlossaryTermInput,
  setGlossaryDefinitionInput,
  onAddGlossaryEntry,
  onRemoveGlossaryEntry,
}: ProjectGlossarySectionProps) {
  const { t } = useTranslation('projects')

  return (
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
        <Button type="button" onClick={onAddGlossaryEntry} variant="outline">
          {t('form.actions.addGlossaryEntry')}
        </Button>
      </div>
      <div className="space-y-2">
        {Object.entries(glossary).map(([term, definition]) => (
          <div key={term} className="flex items-start justify-between gap-2 text-sm">
            <div>
              <div className="font-medium">{term}</div>
              <div className="text-muted-foreground">{definition}</div>
            </div>
            <button
              type="button"
              onClick={() => onRemoveGlossaryEntry(term)}
              className="text-muted-foreground hover:text-destructive"
              aria-label={t('form.actions.removeGlossaryEntry', { term })}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </FormField>
  )
}
