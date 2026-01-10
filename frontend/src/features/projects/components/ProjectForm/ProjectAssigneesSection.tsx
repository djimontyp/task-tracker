/**
 * ProjectForm - Assignees Section
 * Handles default assignee IDs management
 */

import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Input, Button, Badge } from '@/shared/ui'
import { FormField } from '@/shared/patterns'
import type { ProjectAssigneesSectionProps } from './types'

export function ProjectAssigneesSection({
  assigneeIds,
  assigneeInput,
  setAssigneeInput,
  onAddAssignee,
  onRemoveAssignee,
}: ProjectAssigneesSectionProps) {
  const { t } = useTranslation('projects')

  return (
    <FormField label={t('form.fields.assignees.label')}>
      <div className="flex gap-2">
        <Input
          value={assigneeInput}
          onChange={(e) => setAssigneeInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAddAssignee()
            }
          }}
          placeholder={t('form.fields.assignees.placeholder')}
          type="number"
          min={1}
        />
        <Button type="button" onClick={onAddAssignee} variant="outline">
          {t('form.actions.add')}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {assigneeIds.map((assigneeId) => (
          <Badge key={assigneeId} variant="outline" className="text-xs bg-accent/10">
            {assigneeId}
            <button
              type="button"
              onClick={() => onRemoveAssignee(assigneeId)}
              className="ml-2 hover:text-destructive"
              aria-label={t('form.actions.removeAssignee', { id: assigneeId })}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </FormField>
  )
}
