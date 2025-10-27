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
        return 'text-green-600 dark:text-green-400'
      case 'reject':
        return 'text-red-600 dark:text-red-400'
      case 'escalate':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'notify':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Live Preview</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasValidConditions ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Add conditions to preview impact
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
                versions will be{' '}
                <span className={`font-semibold uppercase ${getActionColor(action)}`}>
                  {action}D
                </span>
              </p>
            </div>

            {preview.affected_count > 0 && preview.versions.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Sample versions:</Label>
                <div className="space-y-2">
                  {preview.versions.slice(0, 5).map((version, index) => (
                    <div
                      key={version.id || index}
                      className="text-xs p-2 bg-muted/50 rounded border space-y-1"
                    >
                      <div className="font-medium">{version.topic_name}</div>
                      <div className="text-muted-foreground line-clamp-2">
                        {version.atom_content}
                      </div>
                      <div className="flex gap-2">
                        {version.confidence !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            Confidence: {version.confidence.toFixed(1)}%
                          </Badge>
                        )}
                        {version.similarity !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            Similarity: {version.similarity.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {preview.affected_count > 5 && (
                    <div className="text-xs text-muted-foreground text-center">
                      + {preview.affected_count - 5} more versions
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
