import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { useRuleTemplates } from '../api/automationService'
import type { RuleTemplate } from '../types'

interface RuleTemplatesLibraryProps {
  onSelectTemplate: (template: RuleTemplate) => void
}

export function RuleTemplatesLibrary({ onSelectTemplate }: RuleTemplatesLibraryProps) {
  const { data: templates, isLoading } = useRuleTemplates()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rule Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  const getActionVariant = (
    action: string
  ): 'default' | 'secondary' | 'success' | 'destructive' => {
    switch (action) {
      case 'approve':
        return 'success'
      case 'reject':
        return 'destructive'
      case 'escalate':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {templates && templates.length > 0 ? (
          templates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              onClick={() => onSelectTemplate(template)}
              className="w-full h-auto p-4 flex flex-col items-start gap-2"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-sm">{template.name}</span>
                <Badge variant={getActionVariant(template.action)}>{template.action}</Badge>
              </div>
              <p className="text-xs text-muted-foreground text-left">{template.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Priority: {template.priority}</span>
                <span>•</span>
                <span>{template.conditions.length} conditions</span>
              </div>
            </Button>
          ))
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            No templates available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
