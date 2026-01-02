import { useTranslation } from 'react-i18next'
import { Card, CardContent, Button, Badge } from '@/shared/ui'
import { AgentConfig } from '@/features/agents/types'
import { Pencil, Trash2, Settings, TestTube2, Copy } from 'lucide-react'

interface AgentCardProps {
  agent: AgentConfig
  onEdit: (agent: AgentConfig) => void
  onCopy: (agent: AgentConfig) => void
  onDelete: (id: string) => void
  onManageTasks: (agent: AgentConfig) => void
  onTest: (agent: AgentConfig) => void
  isDeleting?: boolean
}

const AgentCard = ({
  agent,
  onEdit,
  onCopy,
  onDelete,
  onManageTasks,
  onTest,
  isDeleting = false,
}: AgentCardProps) => {
  const { t } = useTranslation('agents')

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{agent.name}</h3>
              {agent.description && (
                <p className="text-sm text-muted-foreground mt-2">{agent.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(agent)}
                aria-label={t('card.actions.edit')}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onCopy(agent)}
                aria-label={t('card.actions.copy')}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onManageTasks(agent)}
                aria-label={t('card.actions.manageTasks')}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onTest(agent)}
                aria-label={t('card.actions.test')}
              >
                <TestTube2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(agent.id)}
                aria-label={t('card.actions.delete')}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">{t('card.fields.model')}</span>
              <p className="font-mono text-xs">{agent.model_name}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {agent.temperature !== undefined && (
                <div>
                  <span className="text-muted-foreground">{t('card.fields.temperature')}</span>
                  <p className="font-mono text-xs">{agent.temperature}</p>
                </div>
              )}
              {agent.max_tokens !== undefined && (
                <div>
                  <span className="text-muted-foreground">{t('card.fields.maxTokens')}</span>
                  <p className="font-mono text-xs">{agent.max_tokens}</p>
                </div>
              )}
            </div>

            <div>
              <span className="text-muted-foreground">{t('card.fields.systemPrompt')}</span>
              <p className="text-xs mt-2 line-clamp-2">{agent.system_prompt}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-muted-foreground">{t('card.fields.status')}</span>
              <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                {agent.is_active ? t('status.active') : t('status.inactive')}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { AgentCard }
