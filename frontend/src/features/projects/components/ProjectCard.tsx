/**
 * Project Card Component
 */

import React from 'react'
import { Card, Badge, Button, Separator } from '@/shared/ui'
import { Pencil, Trash2 } from 'lucide-react'
import type { ProjectConfig } from '../types'

interface ProjectCardProps {
  project: ProjectConfig
  onEdit?: (project: ProjectConfig) => void
  onDelete?: (projectId: string) => void
  isLoading?: boolean
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  isLoading,
}) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{project.name}</h3>
              <Badge variant="outline" className={project.is_active ? 'bg-semantic-success text-white border-semantic-success' : 'bg-muted text-muted-foreground border-border'}>
                {project.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>

        {/* Keywords */}
        {project.keywords.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Keywords</div>
            <div className="flex flex-wrap gap-2">
              {project.keywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Components */}
        {project.components.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Components</div>
            <div className="space-y-2">
              {project.components.map((component, index) => (
                <div
                  key={`${component.name}-${index}`}
                  className="rounded border p-2 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{component.name}</span>
                    {component.description && (
                      <Badge variant="outline" className="text-2xs">
                        {component.description}
                      </Badge>
                    )}
                  </div>
                  {component.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {component.keywords.map((keyword, keywordIndex) => (
                        <Badge key={keywordIndex} variant="outline" className="text-2xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Glossary */}
        {Object.keys(project.glossary).length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Glossary</div>
            <div className="space-y-2 text-xs text-muted-foreground">
              {Object.entries(project.glossary).map(([term, definition]) => (
                <div key={term} className="flex gap-2">
                  <span className="font-medium text-foreground">{term}:</span>
                  <span>{definition}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Priority Rules */}
        {project.priority_rules && Object.keys(project.priority_rules).length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Priority Rules</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {(['critical_keywords', 'high_keywords', 'medium_keywords', 'low_keywords'] as const).map(
                (key) => {
                  const keywords = project.priority_rules?.[key] ?? []
                  if (!keywords.length) return null
                  const labelMap: Record<typeof key, string> = {
                    critical_keywords: 'Critical',
                    high_keywords: 'High',
                    medium_keywords: 'Medium',
                    low_keywords: 'Low',
                  }
                  return (
                    <div key={key} className="space-y-2">
                      <div className="font-medium text-muted-foreground">{labelMap[key]}</div>
                      <div className="flex flex-wrap gap-2">
                        {keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-2xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )
                },
              )}
            </div>
          </div>
        )}

        {/* Assignees & PM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-sm font-medium mb-2">Default Assignees</div>
            <div className="flex flex-wrap gap-2">
              {project.default_assignee_ids.length === 0 ? (
                <span className="text-muted-foreground">None</span>
              ) : (
                project.default_assignee_ids.map((id) => (
                  <Badge key={id} variant="outline" className="text-2xs bg-accent/10">
                    #{id}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Project Manager</div>
            <Badge variant="outline" className="text-2xs">
              User #{project.pm_user_id}
            </Badge>
          </div>
        </div>

        <Separator className="my-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Version {project.version}</span>
          <span>Updated {new Date(project.updated_at).toLocaleString()}</span>
        </div>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex gap-2 pt-4 border-t">
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(project)}
                disabled={isLoading}
                className="flex-1"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(project.id)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
