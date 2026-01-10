/**
 * ProjectForm - Priority Rules Section
 * Handles priority keywords (critical, high, medium, low)
 */

import { useTranslation } from 'react-i18next'
import { Input, Label } from '@/shared/ui'
import type { ProjectPriorityRulesSectionProps, PriorityLevel } from './types'

const PRIORITY_LEVELS: PriorityLevel[] = ['critical', 'high', 'medium', 'low']

export function ProjectPriorityRulesSection({
  priorityInputs,
  onPriorityInputChange,
}: ProjectPriorityRulesSectionProps) {
  const { t } = useTranslation('projects')

  return (
    <div className="space-y-2">
      <Label>{t('form.fields.priorityRules.label')}</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {PRIORITY_LEVELS.map((level) => (
          <div key={level} className="space-y-2">
            <Label htmlFor={`${level}_keywords`} className="text-xs">
              {t(`form.fields.priorityRules.${level}`)}
            </Label>
            <Input
              id={`${level}_keywords`}
              value={priorityInputs[level]}
              onChange={(e) => onPriorityInputChange(level, e.target.value)}
              placeholder={t('form.fields.priorityRules.placeholder')}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
