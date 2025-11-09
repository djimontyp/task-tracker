/**
 * Project Form Component
 */

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Input,
  Textarea,
  Badge,
} from '@/shared/ui'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { ProjectConfig, CreateProjectConfig, ProjectComponent } from '../types'

interface ProjectFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateProjectConfig) => void
  project?: ProjectConfig
  isLoading?: boolean
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  project,
  isLoading,
}) => {
  const [formData, setFormData] = useState<CreateProjectConfig>({
    name: '',
    description: '',
    keywords: [],
    glossary: {},
    components: [],
    default_assignee_ids: [],
    pm_user_id: 0,
    is_active: true,
    priority_rules: {},
    version: '1.0.0',
  })

  const [keywordInput, setKeywordInput] = useState('')
  const [componentNameInput, setComponentNameInput] = useState('')
  const [componentKeywordsInput, setComponentKeywordsInput] = useState('')
  const [componentDescriptionInput, setComponentDescriptionInput] = useState('')
  const [assigneeInput, setAssigneeInput] = useState('')
  const [glossaryTermInput, setGlossaryTermInput] = useState('')
  const [glossaryDefinitionInput, setGlossaryDefinitionInput] = useState('')
  const [priorityInputs, setPriorityInputs] = useState({
    critical: '',
    high: '',
    medium: '',
    low: '',
  })

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        keywords: project.keywords,
        glossary: project.glossary ?? {},
        components: project.components ?? [],
        default_assignee_ids: project.default_assignee_ids ?? [],
        pm_user_id: project.pm_user_id,
        is_active: project.is_active,
        priority_rules: project.priority_rules ?? {},
        version: project.version ?? '1.0.0',
      })
      setPriorityInputs({
        critical: (project.priority_rules?.critical_keywords ?? []).join(', '),
        high: (project.priority_rules?.high_keywords ?? []).join(', '),
        medium: (project.priority_rules?.medium_keywords ?? []).join(', '),
        low: (project.priority_rules?.low_keywords ?? []).join(', '),
      })
    } else {
      setFormData({
        name: '',
        description: '',
        keywords: [],
        glossary: {},
        components: [],
        default_assignee_ids: [],
        pm_user_id: 0,
        is_active: true,
        priority_rules: {},
        version: '1.0.0',
      })
      setPriorityInputs({ critical: '', high: '', medium: '', low: '' })
    }
    setKeywordInput('')
    setComponentNameInput('')
    setComponentKeywordsInput('')
    setComponentDescriptionInput('')
    setAssigneeInput('')
    setGlossaryTermInput('')
    setGlossaryDefinitionInput('')
  }, [project, open])

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords?.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...(formData.keywords || []), keywordInput.trim()],
      })
      setKeywordInput('')
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords?.filter((k) => k !== keyword) || [],
    })
  }

  const handleAddComponent = () => {
    if (!componentNameInput.trim()) {
      return
    }

    const keywords = componentKeywordsInput
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean)

    const newComponent: ProjectComponent = {
      name: componentNameInput.trim(),
      keywords,
      description: componentDescriptionInput.trim() || undefined,
    }

    setFormData({
      ...formData,
      components: [...(formData.components || []), newComponent],
    })
    setComponentNameInput('')
    setComponentKeywordsInput('')
    setComponentDescriptionInput('')
  }

  const handleRemoveComponent = (index: number) => {
    setFormData({
      ...formData,
      components: formData.components?.filter((_, i) => i !== index) || [],
    })
  }

  const handleAddAssignee = () => {
    if (!assigneeInput.trim()) {
      return
    }
    const numericValue = Number(assigneeInput.trim())
    if (Number.isNaN(numericValue)) {
      return
    }
    if (!formData.default_assignee_ids?.includes(numericValue)) {
      setFormData({
        ...formData,
        default_assignee_ids: [...(formData.default_assignee_ids || []), numericValue],
      })
    }
    setAssigneeInput('')
  }

  const handleRemoveAssignee = (assigneeId: number) => {
    setFormData({
      ...formData,
      default_assignee_ids:
        formData.default_assignee_ids?.filter((id) => id !== assigneeId) || [],
    })
  }

  const handleAddGlossaryEntry = () => {
    if (!glossaryTermInput.trim() || !glossaryDefinitionInput.trim()) {
      return
    }
    setFormData({
      ...formData,
      glossary: {
        ...(formData.glossary || {}),
        [glossaryTermInput.trim()]: glossaryDefinitionInput.trim(),
      },
    })
    setGlossaryTermInput('')
    setGlossaryDefinitionInput('')
  }

  const handleRemoveGlossaryEntry = (term: string) => {
    const updatedGlossary = { ...(formData.glossary || {}) }
    delete updatedGlossary[term]
    setFormData({
      ...formData,
      glossary: updatedGlossary,
    })
  }

  const handlePriorityInputChange = (
    level: 'critical' | 'high' | 'medium' | 'low',
    value: string,
  ) => {
    setPriorityInputs({ ...priorityInputs, [level]: value })
    const keyMap: Record<typeof level, keyof NonNullable<CreateProjectConfig['priority_rules']>> = {
      critical: 'critical_keywords',
      high: 'high_keywords',
      medium: 'medium_keywords',
      low: 'low_keywords',
    }

    const keywords = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    setFormData({
      ...formData,
      priority_rules: {
        ...(formData.priority_rules || {}),
        [keyMap[level]]: keywords,
      },
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      return
    }
    const submission: CreateProjectConfig = {
      ...formData,
      keywords: formData.keywords || [],
      components: formData.components || [],
      glossary: formData.glossary || {},
      default_assignee_ids: formData.default_assignee_ids || [],
      pm_user_id: formData.pm_user_id,
      priority_rules:
        formData.priority_rules && Object.keys(formData.priority_rules).length > 0
          ? formData.priority_rules
          : undefined,
    }
    onSubmit(submission)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'Create Project'}</DialogTitle>
          <DialogDescription>
            Configure project settings for AI analysis and task classification
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Task Tracker Frontend"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief project description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pm_user_id">Project Manager User ID *</Label>
            <Input
              id="pm_user_id"
              type="number"
              value={formData.pm_user_id ?? 0}
              onChange={(e) =>
                setFormData({ ...formData, pm_user_id: Number(e.target.value) || 0 })
              }
              min={0}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords</Label>
            <div className="flex gap-2">
              <Input
                id="keywords"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddKeyword()
                  }
                }}
                placeholder="Add keyword and press Enter"
              />
              <Button type="button" onClick={handleAddKeyword} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.keywords?.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="ml-1 hover:text-destructive"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Components</Label>
            <div className="flex flex-col gap-2">
              <Input
                id="component_name"
                value={componentNameInput}
                onChange={(e) => setComponentNameInput(e.target.value)}
                placeholder="Component name"
              />
              <Input
                id="component_keywords"
                value={componentKeywordsInput}
                onChange={(e) => setComponentKeywordsInput(e.target.value)}
                placeholder="Keywords (comma separated)"
              />
              <Textarea
                id="component_description"
                value={componentDescriptionInput}
                onChange={(e) => setComponentDescriptionInput(e.target.value)}
                placeholder="Optional component description"
                rows={2}
              />
              <div className="flex justify-end">
                <Button type="button" onClick={handleAddComponent} variant="outline">
                  Add Component
                </Button>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              {formData.components?.map((component, index) => (
                <div
                  key={`${component.name}-${index}`}
                  className="flex flex-col gap-1 rounded border p-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{component.name}</div>
                    <button
                      type="button"
                      onClick={() => handleRemoveComponent(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {component.description && (
                    <div className="text-xs text-muted-foreground">
                      {component.description}
                    </div>
                  )}
                  {component.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
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

          <div className="space-y-2">
            <Label>Default Assignee IDs</Label>
            <div className="flex gap-2">
              <Input
                value={assigneeInput}
                onChange={(e) => setAssigneeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddAssignee()
                  }
                }}
                placeholder="Enter user ID and press Enter"
              />
              <Button type="button" onClick={handleAddAssignee} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.default_assignee_ids?.map((assigneeId) => (
                <Badge key={assigneeId} variant="outline" className="text-xs bg-purple-50">
                  {assigneeId}
                  <button
                    type="button"
                    onClick={() => handleRemoveAssignee(assigneeId)}
                    className="ml-1 hover:text-destructive"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Glossary</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                value={glossaryTermInput}
                onChange={(e) => setGlossaryTermInput(e.target.value)}
                placeholder="Term"
              />
              <Input
                value={glossaryDefinitionInput}
                onChange={(e) => setGlossaryDefinitionInput(e.target.value)}
                placeholder="Definition"
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={handleAddGlossaryEntry} variant="outline">
                Add Glossary Entry
              </Button>
            </div>
            <div className="space-y-2">
              {Object.entries(formData.glossary || {}).map(([term, definition]) => (
                <div key={term} className="flex items-start justify-between gap-2 text-sm">
                  <div>
                    <div className="font-medium">{term}</div>
                    <div className="text-muted-foreground">{definition}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGlossaryEntry(term)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Priority Rules</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="critical_keywords" className="text-xs">
                  Critical Keywords
                </Label>
                <Input
                  id="critical_keywords"
                  value={priorityInputs.critical}
                  onChange={(e) => handlePriorityInputChange('critical', e.target.value)}
                  placeholder="Comma separated keywords"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="high_keywords" className="text-xs">
                  High Keywords
                </Label>
                <Input
                  id="high_keywords"
                  value={priorityInputs.high}
                  onChange={(e) => handlePriorityInputChange('high', e.target.value)}
                  placeholder="Comma separated keywords"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="medium_keywords" className="text-xs">
                  Medium Keywords
                </Label>
                <Input
                  id="medium_keywords"
                  value={priorityInputs.medium}
                  onChange={(e) => handlePriorityInputChange('medium', e.target.value)}
                  placeholder="Comma separated keywords"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="low_keywords" className="text-xs">
                  Low Keywords
                </Label>
                <Input
                  id="low_keywords"
                  value={priorityInputs.low}
                  onChange={(e) => handlePriorityInputChange('low', e.target.value)}
                  placeholder="Comma separated keywords"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              value={formData.version ?? '1.0.0'}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="e.g., 1.0.0"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
