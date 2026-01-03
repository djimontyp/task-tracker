import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, Button, Badge, Spinner } from '@/shared/ui'
import { CompactCard, type CompactCardAction } from '@/shared/patterns'
import { cn } from '@/shared/lib'
import { AgentConfig } from '@/features/agents/types'
import { Pencil, Trash2, Settings, TestTube2, Copy, AlertCircle, RefreshCw } from 'lucide-react'

interface AgentCardProps {
  agent: AgentConfig
  className?: string
  onEdit: (agent: AgentConfig) => void
  onCopy: (agent: AgentConfig) => void
  onDelete: (id: string) => void
  onManageTasks: (agent: AgentConfig) => void
  onTest: (agent: AgentConfig) => void
  isDeleting?: boolean
  isLoading?: boolean
  isError?: boolean
  error?: Error
  onRetry?: () => void
}

const AgentCard = React.forwardRef<HTMLDivElement, AgentCardProps>(
  (
    {
      agent,
      className,
      onEdit,
      onCopy,
      onDelete,
      onManageTasks,
      onTest,
      isDeleting = false,
      isLoading = false,
      isError = false,
      error,
      onRetry,
    },
    ref
  ) => {
    const { t } = useTranslation('agents')

    if (isError) {
      return (
        <Card ref={ref}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('card.error.title', 'Failed to load')}</p>
                {error && <p className="text-xs text-muted-foreground">{error.message}</p>}
              </div>
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('card.error.retry', 'Retry')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    if (isLoading) {
      return (
        <Card ref={ref}>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      )
    }

    // Build actions for CompactCard
    const primaryAction: CompactCardAction = {
      label: t('card.actions.edit', 'Edit'),
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => onEdit(agent),
    }

    const secondaryActions: CompactCardAction[] = [
      {
        label: t('card.actions.copy', 'Copy'),
        icon: <Copy className="h-4 w-4" />,
        onClick: () => onCopy(agent),
      },
      {
        label: t('card.actions.manageTasks', 'Manage Tasks'),
        icon: <Settings className="h-4 w-4" />,
        onClick: () => onManageTasks(agent),
      },
      {
        label: t('card.actions.test', 'Test'),
        icon: <TestTube2 className="h-4 w-4" />,
        onClick: () => onTest(agent),
      },
      {
        label: t('card.actions.delete', 'Delete'),
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => onDelete(agent.id),
        variant: 'destructive',
        disabled: isDeleting,
      },
    ]

    const statusBadge = (
      <Badge variant={agent.is_active ? 'default' : 'secondary'}>
        {agent.is_active ? t('status.active', 'Active') : t('status.inactive', 'Inactive')}
      </Badge>
    )

    const compactContent = agent.description ? (
      <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>
    ) : null

    return (
      <>
        {/* Compact variant - mobile only (hidden on sm and above) */}
        <CompactCard
          title={agent.name}
          badge={statusBadge}
          primaryAction={primaryAction}
          secondaryActions={secondaryActions}
          content={compactContent}
          className={className}
        />

        {/* Default variant - desktop (hidden below sm) */}
        <Card ref={ref} className={cn('card-interactive hidden sm:block', className)}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{agent.name}</h3>
                {agent.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{agent.description}</p>
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
              <div className="min-w-0">
                <span className="text-muted-foreground">{t('card.fields.model')}</span>
                <p className="font-mono text-xs truncate">{agent.model_name}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
    </>
  )
})

AgentCard.displayName = 'AgentCard'

export { AgentCard }
