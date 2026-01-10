import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Badge, Button, Separator } from '@/shared/ui'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible'
import { CompactCard, type CompactCardAction } from '@/shared/patterns'
import { cn } from '@/shared/lib'
import { useLocalStorage, useMediaQuery } from '@/shared/hooks'
import { Pencil, Trash2, ChevronDown, ChevronRight, Database, Calendar, Tag } from 'lucide-react'
import type { TaskConfig } from '../types'

interface TaskTemplateCardState {
    isSchemaOpen: boolean
}

export interface TaskTemplateCardProps {
    task: TaskConfig
    className?: string
    onEdit?: (task: TaskConfig) => void
    onDelete?: (taskId: string) => void
}

export const TaskTemplateCard = React.forwardRef<HTMLDivElement, TaskTemplateCardProps>(
    ({ task, className, onEdit, onDelete }, ref) => {
        const { t } = useTranslation('agentTasks')
        const { t: tCommon } = useTranslation()
        const isDesktop = useMediaQuery('(min-width: 640px)') // sm breakpoint

        // Collapsible states with persistence
        const [state, setState] = useLocalStorage<TaskTemplateCardState>(`task-template-card-state-${task.id}`, {
            isSchemaOpen: false,
        })

        const toggleSchema = (open: boolean) => setState(prev => ({ ...prev, isSchemaOpen: open }))

        // Status Badge
        const StatusBadge = () => (
            <Badge
                variant="outline"
                className={
                    task.is_active
                        ? 'bg-semantic-success/10 text-semantic-success border-semantic-success/20'
                        : 'bg-muted text-muted-foreground border-border'
                }
            >
                {task.is_active ? tCommon('status.active') : tCommon('status.inactive')}
            </Badge>
        )

        // Schema Keys for display
        const schemaKeys = task.response_schema?.properties ? Object.keys(task.response_schema.properties) : []

        // MOBILE VIEW (CompactCard)
        if (!isDesktop) {
            const primaryAction: CompactCardAction | undefined = onEdit
                ? {
                    label: tCommon('actions.edit'),
                    icon: <Pencil className="h-4 w-4" />,
                    onClick: () => onEdit(task),
                }
                : undefined

            const secondaryActions: CompactCardAction[] = []
            if (onDelete) {
                secondaryActions.push({
                    label: tCommon('actions.delete'),
                    icon: <Trash2 className="h-4 w-4" />,
                    onClick: () => onDelete(task.id),
                    variant: 'destructive',
                })
            }

            const compactContent = (
                <div className="space-y-2">
                    {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                    )}
                    {schemaKeys.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {schemaKeys.slice(0, 3).map(key => (
                                <Badge key={key} variant="secondary" className="text-[10px] h-5">{key}</Badge>
                            ))}
                            {schemaKeys.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">+{schemaKeys.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>
            )

            return (
                <CompactCard
                    ref={ref}
                    title={task.name}
                    badge={<StatusBadge />}
                    primaryAction={primaryAction}
                    secondaryActions={secondaryActions.length > 0 ? secondaryActions : undefined}
                    content={compactContent}
                    className={className}
                />
            )
        }

        // DESKTOP VIEW (Card)
        return (
            <Card ref={ref} className={cn('p-4 hover:shadow-md transition-shadow flex flex-col h-full', className)}>
                <div className="space-y-4 flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 min-w-0">
                                <h3 className="text-lg font-semibold truncate text-foreground/90">{task.name}</h3>
                                <StatusBadge />
                            </div>
                            {task.description && (
                                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed" title={task.description}>
                                    {task.description}
                                </p>
                            )}
                        </div>

                        {/* Desktop Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                            {onEdit && (
                                <Button variant="ghost" size="icon" onClick={() => onEdit(task)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">{tCommon('actions.edit')}</span>
                                </Button>
                            )}
                            {onDelete && (
                                <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">{tCommon('actions.delete')}</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Keywords / Schema Keys */}
                    {schemaKeys.length > 0 && (
                        <div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {t('card.schemaFields', 'Schema Fields')}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {schemaKeys.map((key) => (
                                    <Badge key={key} variant="secondary" className="font-normal">
                                        {key}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Collapsibles */}
                <div className="mt-4 pt-4 border-t space-y-2">
                    {/* Schema Details Collapsible */}
                    <Collapsible
                        open={state.isSchemaOpen}
                        onOpenChange={toggleSchema}
                        className="border rounded-md px-2 py-2 bg-muted/30"
                    >
                        <CollapsibleTrigger asChild>
                            <button className="flex items-center justify-between w-full text-sm font-medium hover:text-primary transition-colors">
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4 text-muted-foreground" />
                                    <span>{t('card.schemaStructure', 'Schema Structure')}</span>
                                </div>
                                {state.isSchemaOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2">
                            <div className="space-y-1">
                                {schemaKeys.length > 0 ? (
                                    Object.entries(task.response_schema.properties).map(([key, prop]) => {
                                        const isRequired = task.response_schema.required?.includes(key)
                                        return (
                                            <div key={key} className="bg-background rounded-md p-2 border text-sm shadow-sm grid grid-cols-[1fr_auto] gap-2 items-center">
                                                <div>
                                                    <div className="font-medium flex items-center gap-2">
                                                        {key}
                                                        {isRequired && <span className="text-[10px] text-destructive font-bold uppercase">*{t('common.required', 'Required')}*</span>}
                                                    </div>
                                                    {prop.description && (
                                                        <div className="text-xs text-muted-foreground mt-0.5">{prop.description}</div>
                                                    )}
                                                </div>
                                                <Badge variant="outline" className="text-xs font-mono">
                                                    {prop.type}
                                                </Badge>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-sm text-muted-foreground p-2">{t('card.noSchema', 'No schema defined')}</div>
                                )}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    <div className="mt-auto pt-4">
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                {/* Placeholder for future usage, e.g. Assinged Agents count */}
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{new Date(task.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        )
    }
)

TaskTemplateCard.displayName = 'TaskTemplateCard'
