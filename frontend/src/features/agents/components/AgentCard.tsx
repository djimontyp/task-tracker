import React, { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Button,
  Badge,
  Spinner,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui'
import { CompactCard, type CompactCardAction } from '@/shared/patterns'
import { cn } from '@/shared/lib'
import { AgentConfig } from '@/features/agents/types'
import { GoldenSetTestDialog } from './GoldenSetTestDialog'
import { useAgentStats } from '@/features/agents/hooks/useAgentStats'
import {
  Pencil,
  Trash2,
  Settings,
  TestTube2,
  Copy,
  AlertCircle,
  RefreshCw,
  MoreHorizontal,
  Bot,
  Cpu,
  Activity,
  CheckCircle2,
  Clock,
  Terminal,
  FileCheck,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { uk, enUS } from 'date-fns/locale'

export interface AgentCardProps {
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
      isDeleting: _isDeleting = false,
      isLoading = false,
      isError = false,
      error,
      onRetry,
    },
    ref
  ) => {
    const { t, i18n } = useTranslation('agents')
    const { data: stats, isLoading: isStatsLoading } = useAgentStats(agent.id)
    const dateLocale = i18n.language === 'uk' ? uk : enUS
    const [showGoldenSetTest, setShowGoldenSetTest] = useState(false)

    // --- Memoized callbacks (must be before any early returns) ---
    const handleTest = useCallback(() => onTest(agent), [onTest, agent])
    const handleEdit = useCallback(() => onEdit(agent), [onEdit, agent])
    const handleCopy = useCallback(() => onCopy(agent), [onCopy, agent])
    const handleManageTasks = useCallback(() => onManageTasks(agent), [onManageTasks, agent])
    const handleDelete = useCallback(() => onDelete(agent.id), [onDelete, agent.id])

    const compactPrimaryAction: CompactCardAction = useMemo(() => ({
      label: t('card.actions.test', 'Test'),
      icon: <TestTube2 className="h-4 w-4" />,
      onClick: handleTest,
    }), [t, handleTest])

    const compactSecondaryActions: CompactCardAction[] = useMemo(() => [
      {
        label: t('card.actions.edit', 'Edit'),
        icon: <Pencil className="h-4 w-4" />,
        onClick: handleEdit,
      },
      {
        label: t('card.actions.manageTasks', 'Tasks'),
        icon: <Settings className="h-4 w-4" />,
        onClick: handleManageTasks,
      },
      {
        label: t('card.actions.copy', 'Copy'),
        icon: <Copy className="h-4 w-4" />,
        onClick: handleCopy,
      },
      {
        label: t('card.actions.delete', 'Delete'),
        icon: <Trash2 className="h-4 w-4" />,
        onClick: handleDelete,
        variant: 'destructive' as const,
      },
    ], [t, handleEdit, handleManageTasks, handleCopy, handleDelete])

    // Error State
    if (isError) {
      return (
        <Card ref={ref} className="h-full border-destructive/50">
          <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center gap-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="space-y-1">
              <p className="font-medium">{t('card.error.title', 'Failed to load')}</p>
              {error && <p className="text-xs text-muted-foreground">{error.message}</p>}
            </div>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('card.error.retry', 'Retry')}
              </Button>
            )}
          </CardContent>
        </Card>
      )
    }

    // Loading State
    if (isLoading) {
      return (
        <Card ref={ref} className="h-full">
          <CardContent className="h-full flex items-center justify-center p-8">
            <Spinner className="h-8 w-8 text-primary/50" />
          </CardContent>
        </Card>
      )
    }

    // Status Avatar
    const statusAvatar = (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-300 relative",
              agent.is_active
                ? "bg-status-connected/10 text-status-connected ring-1 ring-status-connected/20"
                : "bg-muted text-muted-foreground/50"
            )}>
              <Bot className="h-6 w-6" />
              {/* Status Dot */}
              <div className={cn(
                "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background",
                agent.is_active ? "bg-status-connected animate-pulse motion-reduce:animate-none" : "bg-muted-foreground/40"
              )} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{agent.is_active ? t('status.active', 'Active Agent') : t('status.inactive', 'Inactive Agent')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )

    // Helper: Format Recency
    const formatLastRun = (dateStr: string | null) => {
      if (!dateStr) return '—';
      try {
        const date = new Date(dateStr);
        return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale });
      } catch {
        return '—';
      }
    }

    const MetricItem = ({ icon: Icon, label, value, valueClass }: {
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      value: string | number;
      valueClass?: string;
    }) => (
      <div className="flex flex-col items-center w-1/3 group/metric">
        <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-2 opacity-80 group-hover/metric:opacity-100 transition-opacity">
          <Icon className="h-3.5 w-3.5" /> {label}
        </span>
        <span className={cn("text-xs font-mono font-medium truncate max-w-full px-1 pt-0.5", valueClass)} title={typeof value === 'string' ? value : ''}>
          {isStatsLoading ? "..." : value}
        </span>
      </div>
    )

    return (
      <>
        {/* Mobile View */}
        <div className="block sm:hidden">
          <CompactCard
            title={agent.name}
            badge={<Badge variant={agent.is_active ? "default" : "secondary"}>{agent.is_active ? "ON" : "OFF"}</Badge>}
            primaryAction={compactPrimaryAction}
            secondaryActions={compactSecondaryActions}
            content={agent.description ? <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p> : null}
            className={className}
          />
        </div>

        {/* Desktop View */}
        <Card ref={ref} className={cn('hidden sm:flex flex-col h-full hover:border-primary/40 hover:shadow-md transition-all duration-300', className)}>

          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-3">
            <div className="flex items-center gap-4 min-w-0">
              {statusAvatar}
              <div className="flex flex-col min-w-0 gap-0.5">
                <h3 className="font-semibold text-base leading-none truncate tracking-tight text-foreground/95" title={agent.name}>
                  {agent.name}
                </h3>
                {agent.description ? (
                  <p className="text-[11px] text-muted-foreground truncate w-40" title={agent.description}>
                    {agent.description}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground/40 italic">{t('card.noDescription')}</p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground/60 hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleManageTasks}>
                  <Settings className="mr-2 h-4 w-4" /> {t('card.actions.manageTasks', 'Tasks')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowGoldenSetTest(true)}>
                  <FileCheck className="mr-2 h-4 w-4" /> {t('actions.goldenSetTest', 'Golden Set Test')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" /> {t('card.actions.copy', 'Clone')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> {t('card.actions.delete', 'Delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>

          <CardContent className="flex-1 px-4 py-2 space-y-4">

            {/* Vital Signs Strip */}
            <div className="flex items-center justify-between py-3 px-1 border-y border-border/40 bg-muted/5 rounded-sm">
              <MetricItem
                icon={Activity}
                label={t('card.metrics.last')}
                value={formatLastRun(stats?.last_run_at ?? null)}
              />
              <div className="w-px h-7 bg-border/40" />
              <MetricItem
                icon={CheckCircle2}
                label={t('card.metrics.success')}
                value={`${stats?.success_rate ?? 0}%`}
                valueClass={(stats?.success_rate ?? 0) >= 90 ? "text-status-connected" : (stats?.success_rate ?? 0) >= 50 ? "text-semantic-warning" : "text-destructive"}
              />
              <div className="w-px h-7 bg-border/40" />
              <MetricItem
                icon={Clock}
                label={t('card.metrics.time')}
                value={`${(stats?.avg_duration_sec ?? 0).toFixed(1)}s`}
                valueClass="text-foreground"
              />
            </div>

            {/* Model Info */}
            <div className="bg-muted/30 rounded-md px-3 py-2 border border-border/30 flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-mono text-foreground/90 truncate" title={agent.model_name}>
                {agent.model_name}
              </span>
            </div>

            {/* System Prompt Snippet */}
            <div className="min-h-[3.5rem] bg-muted/20 rounded-md p-3 border border-border/20 group/prompt">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-3 w-3 text-muted-foreground/70" />
                <span className="text-[10px] uppercase font-semibold text-muted-foreground/70 group-hover/prompt:text-muted-foreground transition-colors">{t('card.systemPromptLabel')}</span>
              </div>
              <p className="text-[11px] text-muted-foreground/80 font-mono leading-relaxed line-clamp-3">
                {agent.system_prompt
                  ? agent.system_prompt
                  : <span className="italic opacity-50">{t('card.no_prompt', 'No system prompt configured')}</span>}
              </p>
            </div>

          </CardContent>

          <CardFooter className="p-4 pt-1 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-muted/80 hover:text-foreground"
              onClick={handleEdit}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t('card.actions.edit', 'Edit')}
            </Button>

            <Button
              size="sm"
              className="shadow-sm hover:shadow hover:bg-primary/90"
              onClick={handleTest}
            >
              <TestTube2 className="h-4 w-4 mr-2" />
              {t('card.actions.test', 'Test')}
            </Button>
          </CardFooter>

        </Card>

        <GoldenSetTestDialog
          agent={agent}
          open={showGoldenSetTest}
          onOpenChange={setShowGoldenSetTest}
        />
      </>
    )
  }
)

AgentCard.displayName = 'AgentCard'

export { AgentCard }
