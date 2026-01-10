/**
 * Project Card Component
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Badge, Button, Separator, Spinner } from '@/shared/ui'
import { CardContent } from '@/shared/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible'
import { CompactCard, type CompactCardAction } from '@/shared/patterns'
import { cn } from '@/shared/lib'
import { useLocalStorage, useMediaQuery } from '@/shared/hooks'
import { Pencil, Trash2, AlertCircle, RefreshCw, ChevronDown, ChevronRight, Layers, Book, User, Calendar } from 'lucide-react'
import type { ProjectConfig } from '../types'

interface ProjectCardState {
  isComponentsOpen: boolean
  isGlossaryOpen: boolean
  isRulesOpen: boolean
  isKeywordsExpanded: boolean
}

export interface ProjectCardProps {
  project: ProjectConfig
  className?: string
  onEdit?: (project: ProjectConfig) => void
  onDelete?: (projectId: string) => void
  isLoading?: boolean
  isError?: boolean
  error?: Error
  onRetry?: () => void
}

export const ProjectCard = React.forwardRef<HTMLDivElement, ProjectCardProps>(
  ({ project, className, onEdit, onDelete, isLoading, isError, error, onRetry }, ref) => {
    const { t } = useTranslation('projects')
    const isDesktop = useMediaQuery('(min-width: 640px)') // sm breakpoint

    // Collapsible states with persistence
    const [state, setState] = useLocalStorage<ProjectCardState>(`project-card-state-${project.id}`, {
      isComponentsOpen: false, // Default closed as per user request
      isGlossaryOpen: false,
      isRulesOpen: false,
      isKeywordsExpanded: false,
    })

    const updateState = (updates: Partial<ProjectCardState>) => {
      setState((prev) => ({ ...prev, ...updates }))
    }

    // Helper toggle functions
    const toggleGlossary = (open: boolean) => updateState({ isGlossaryOpen: open })
    const toggleKeywords = () => updateState({ isKeywordsExpanded: !state.isKeywordsExpanded })

    if (isError) {
      return (
        <Card ref={ref} className={className}>
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
        <Card ref={ref} className={className}>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      )
    }

    // Status Badge Component
    const StatusBadge = () => (
      <Badge
        variant="outline"
        className={
          project.is_active
            ? 'bg-semantic-success/10 text-semantic-success border-semantic-success/20'
            : 'bg-muted text-muted-foreground border-border'
        }
      >
        {project.is_active ? t('status.active', 'Active') : t('status.inactive', 'Inactive')}
      </Badge>
    )

    // MOBILE VIEW (CompactCard)
    if (!isDesktop) {
      const primaryAction: CompactCardAction | undefined = onEdit
        ? {
          label: t('card.actions.edit', 'Edit'),
          icon: <Pencil className="h-4 w-4" />,
          onClick: () => onEdit(project),
        }
        : undefined

      const secondaryActions: CompactCardAction[] = []
      if (onDelete) {
        secondaryActions.push({
          label: t('card.actions.delete', 'Delete'),
          icon: <Trash2 className="h-4 w-4" />,
          onClick: () => onDelete(project.id),
          variant: 'destructive',
        })
      }

      const compactContent = project.description ? (
        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
      ) : null

      return (
        <CompactCard
          ref={ref}
          title={project.name}
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
                <h3 className="text-lg font-semibold truncate text-foreground/90">{project.name}</h3>
                <StatusBadge />
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed" title={project.description}>
                  {project.description}
                </p>
              )}
            </div>

            {/* Desktop Actions (Top Right) */}
            <div className="flex items-center gap-1 shrink-0">
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={() => onEdit(project)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">{t('card.actions.edit')}</span>
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" onClick={() => onDelete(project.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{t('card.actions.delete')}</span>
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Keywords */}
          {project.keywords.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t('card.keywords')}
              </div>
              <div className="flex flex-wrap gap-2">
                {project.keywords.slice(0, state.isKeywordsExpanded ? undefined : 5).map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="font-normal">
                    {keyword}
                  </Badge>
                ))}
                {project.keywords.length > 5 && (
                  <button
                    onClick={toggleKeywords}
                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-2 py-0.5 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {state.isKeywordsExpanded ? t('card.keywords.showLess') : `+${project.keywords.length - 5}`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer / Collapsibles */}
        <div className="mt-4 pt-4 border-t space-y-2">
          {/* Components Section */}
          {project.components.length > 0 && (
            <Collapsible
              open={state.isComponentsOpen}
              onOpenChange={(open) => updateState({ isComponentsOpen: open })}
              className="border rounded-md px-2 py-2 bg-muted/30"
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full text-sm font-medium hover:text-primary transition-colors">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span>{t('card.components')}</span>
                  </div>
                  {state.isComponentsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-2">
                  {project.components.map((comp) => (
                    <div key={comp.name} className="bg-background rounded-md p-2 border text-sm shadow-sm">
                      <div className="font-medium">{comp.name}</div>
                      {comp.description && (
                        <div className="text-xs text-muted-foreground mt-1">{comp.description}</div>
                      )}
                      {comp.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {comp.keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="text-[10px] h-5">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Collapsible Glossary */}
          {Object.keys(project.glossary).length > 0 && (
            <Collapsible open={state.isGlossaryOpen} onOpenChange={toggleGlossary} className="border rounded-md px-3 py-2 bg-muted/30">
              <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium hover:text-primary transition-colors">
                <div className="flex items-center gap-2">
                  <Book className="h-4 w-4 text-muted-foreground" />
                  <span>{t('card.glossary')} <span className="text-muted-foreground ml-1">({Object.keys(project.glossary).length})</span></span>
                </div>
                {state.isGlossaryOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs">
                  {Object.entries(project.glossary).map(([term, definition]) => (
                    <React.Fragment key={term}>
                      <dt className="font-semibold text-foreground">{term}:</dt>
                      <dd className="text-muted-foreground break-words">{definition}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="mt-auto pt-4">
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                <span>
                  {project.default_assignee_ids.length > 0
                    ? `${project.default_assignee_ids.length} ${t('card.assignees', 'Assignees')}`
                    : t('card.noAssignees', 'No Assignees')
                  }
                </span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(project.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }
)

ProjectCard.displayName = 'ProjectCard'
