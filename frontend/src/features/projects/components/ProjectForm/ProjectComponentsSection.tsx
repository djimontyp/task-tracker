/**
 * ProjectForm - Components Section
 * Handles project components CRUD
 */

import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Input, Textarea, Button, Badge, Label } from '@/shared/ui'
import type { ProjectComponentsSectionProps } from './types'

export function ProjectComponentsSection({
  components,
  componentNameInput,
  componentKeywordsInput,
  componentDescriptionInput,
  setComponentNameInput,
  setComponentKeywordsInput,
  setComponentDescriptionInput,
  onAddComponent,
  onRemoveComponent,
}: ProjectComponentsSectionProps) {
  const { t } = useTranslation('projects')

  return (
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
          <Button type="button" onClick={onAddComponent} variant="outline">
            {t('form.actions.addComponent')}
          </Button>
        </div>
      </div>
      <div className="space-y-2 mt-2">
        {components.map((component, index) => (
          <div
            key={`${component.name}-${index}`}
            className="flex flex-col gap-2 rounded border p-2 text-sm"
          >
            <div className="flex items-center justify-between">
              <div className="font-medium">{component.name}</div>
              <button
                type="button"
                onClick={() => onRemoveComponent(index)}
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
  )
}
