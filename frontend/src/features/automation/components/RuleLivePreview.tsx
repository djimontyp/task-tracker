import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { Label } from '@/shared/ui/label'
import { Badge } from '@/shared/ui/badge'
import { automationService } from '../api/automationService'
import type { RuleCondition } from '../types'

interface RuleLivePreviewProps {
  conditions: RuleCondition[]
  action: 'approve' | 'reject' | 'escalate' | 'notify'
  logicOperator: 'AND' | 'OR'
}

export function RuleLivePreview({ conditions, action, logicOperator }: RuleLivePreviewProps) {
  const { t } = useTranslation('settings')
  const hasValidConditions = conditions.length > 0 && conditions.every((c) => c.field && c.value)

  const { data: preview, isLoading } = useQuery({
    queryKey: ['rule-preview', conditions, action, logicOperator],
    queryFn: () => {
      const conditionsJson = JSON.stringify({ conditions, logic_operator: logicOperator })
      return automationService.evaluateRule(conditionsJson, action)
    },
    enabled: hasValidConditions,
    refetchOnWindowFocus: false,
  })

  const getActionColor = (act: string) => {
    switch (act) {
      case 'approve':
        return 'text-semantic-success'
      case 'reject':
        return 'text-semantic-error'
      case 'escalate':
        return 'text-semantic-warning'
      case 'notify':
        return 'text-semantic-info'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('automation.rules.livePreview.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasValidConditions ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            {t('automation.rules.livePreview.addConditionsPrompt')}
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div>
              <div className="text-4xl font-bold">{preview.affected_count}</div>
              <p className="text-sm text-muted-foreground">
                {t('automation.rules.livePreview.versionsWillBe')}{' '}
                <span className={`font-semibold uppercase ${getActionColor(action)}`}>
                  {action}D
                </span>
              </p>
            </div>

            {preview.affected_count > 0 && preview.versions.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">{t('automation.rules.livePreview.sampleVersions')}</Label>
                <div className="space-y-2">
                  {preview.versions.slice(0, 5).map((version, index) => (
                    <div
                      key={version.id || index}
                      className="text-xs p-2 bg-muted/50 rounded border space-y-2"
                    >
                      <div className="font-medium">{version.topic_name}</div>
                      <div className="text-muted-foreground line-clamp-2">
                        {version.atom_content}
                      </div>
                      <div className="flex gap-2">
                        {version.confidence !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {t('automation.review.confidence')} {version.confidence.toFixed(1)}%
                          </Badge>
                        )}
                        {version.similarity !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {t('automation.review.similarity')} {version.similarity.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {preview.affected_count > 5 && (
                    <div className="text-xs text-muted-foreground text-center">
                      {t('automation.rules.livePreview.moreVersions', { count: preview.affected_count - 5 })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
