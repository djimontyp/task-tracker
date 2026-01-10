/**
 * Projects Page - Configure classification projects
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Spinner,
  Button,
  Card,
  Input,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui'
import { projectService } from '@/features/projects/api/projectService'
import { ProjectCard, ProjectForm } from '@/features/projects/components'
import type { ProjectConfig, ProjectListResponse } from '@/features/projects/types'
import { toast } from 'sonner'
import { Plus, Search, Folder, AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/shared/patterns'
import { PageWrapper } from '@/shared/primitives'

const ProjectsPage = () => {
  const { t } = useTranslation('projects')
  const { t: tCommon } = useTranslation()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectConfig | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const {
    data: projectsResponse,
    isLoading,
    error,
  } = useQuery<ProjectListResponse>({
    queryKey: ['projects'],
    queryFn: () => projectService.listProjects(),
  })

  const projects = projectsResponse?.items ?? []
  const totalProjects = projectsResponse?.total ?? projects.length

  // Filter projects by search query
  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()

    const descriptionMatch = project.description.toLowerCase().includes(query)
    const keywordsMatch = project.keywords.some((keyword) => keyword.toLowerCase().includes(query))
    const componentsMatch = project.components.some((component) => {
      const nameMatch = component.name.toLowerCase().includes(query)
      const keywordMatch = component.keywords.some((keyword) => keyword.toLowerCase().includes(query))
      const description = component.description ?? ''
      const descriptionMatchComponent = description.toLowerCase().includes(query)
      return nameMatch || keywordMatch || descriptionMatchComponent
    })
    const glossaryMatch = Object.entries(project.glossary).some(([term, definition]) => {
      return term.toLowerCase().includes(query) || definition.toLowerCase().includes(query)
    })
    const priorityRulesMatch = Object.values(project.priority_rules ?? {}).some((value) => {
      if (Array.isArray(value)) {
        return value.some((item) => String(item).toLowerCase().includes(query))
      }
      if (value && typeof value === 'object') {
        return Object.values(value).some((item) => String(item).toLowerCase().includes(query))
      }
      return String(value ?? '').toLowerCase().includes(query)
    })

    const assigneesMatch = project.default_assignee_ids
      .map((id) => id.toString())
      .some((id) => id.includes(query))
    const pmMatch = project.pm_user_id.toString().includes(query)

    return (
      project.name.toLowerCase().includes(query) ||
      descriptionMatch ||
      keywordsMatch ||
      componentsMatch ||
      glossaryMatch ||
      priorityRulesMatch ||
      assigneesMatch ||
      pmMatch
    )
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success(tCommon('toast.success.created', { entity: tCommon('toast.entities.project') }))
      setFormOpen(false)
      setSelectedProject(undefined)
    },
    // onError removed — form handles errors now
  })

  const updateMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      projectService.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success(tCommon('toast.success.updated', { entity: tCommon('toast.entities.project') }))
      setFormOpen(false)
      setSelectedProject(undefined)
    },
    // onError removed — form handles errors now
  })

  const deleteMutation = useMutation({
    mutationFn: projectService.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success(tCommon('toast.success.deleted', { entity: tCommon('toast.entities.project') }))
    },
    onError: (error: Error) => {
      toast.error(error.message || tCommon('toast.error.deleteFailed', { entity: tCommon('toast.entities.project') }))
    },
  })

  const handleCreate = () => {
    setSelectedProject(undefined)
    setFormOpen(true)
  }

  const handleEdit = (project: ProjectConfig) => {
    setSelectedProject(project)
    setFormOpen(true)
  }

  const handleDeleteClick = (projectId: string) => {
    setDeleteId(projectId)
  }

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId)
      setDeleteId(null)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    if (selectedProject) {
      await updateMutation.mutateAsync({ id: selectedProject.id, data })
    } else {
      await createMutation.mutateAsync(data)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <Card className="p-6 border-destructive">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold text-destructive mb-2">{t('errors.loadingFailed')}</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : tCommon('labels.unknown')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Calculate stats
  const activeProjects = projects.filter(p => p.is_active).length
  const totalKeywords = projects.reduce((acc, p) => acc + p.keywords.length, 0)
  const totalComponents = projects.reduce((acc, p) => acc + p.components.length, 0)

  return (
    <PageWrapper variant="fullWidth">
      {/* Header & Stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title', 'Projects')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('subtitle', 'Manage classification rules and knowledge organization')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreate} size="default">
            <Plus className="h-4 w-4 mr-2" />
            {t('actions.createProject')}
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between hover:bg-muted/5 transition-colors">
          <span className="text-xs text-muted-foreground font-medium uppercase">{t('stats.total', 'Total Projects')}</span>
          <span className="text-2xl font-bold">{totalProjects}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:bg-muted/5 transition-colors">
          <span className="text-xs text-muted-foreground font-medium uppercase">{t('stats.active', 'Active')}</span>
          <span className="text-2xl font-bold text-semantic-success">{activeProjects}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:bg-muted/5 transition-colors">
          <span className="text-xs text-muted-foreground font-medium uppercase">{t('stats.components', 'Components')}</span>
          <span className="text-2xl font-bold">{totalComponents}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between hover:bg-muted/5 transition-colors">
          <span className="text-xs text-muted-foreground font-medium uppercase">{t('stats.keywords', 'Keywords')}</span>
          <span className="text-2xl font-bold">{totalKeywords}</span>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-background"
          />
        </div>
        <div className="text-xs text-muted-foreground ml-auto">
          {t('search.showing', { filtered: filteredProjects.length, total: totalProjects })}
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          variant="card"
          icon={Folder}
          title={t('empty.title')}
          description={
            totalProjects === 0
              ? t('empty.description.noProjects')
              : t('empty.description.noResults')
          }
          action={
            totalProjects === 0 ? (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t('actions.createProject')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 pb-8">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              isLoading={deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirmDialog.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tCommon('confirmDialog.deleteProject')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              {tCommon('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        project={selectedProject}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </PageWrapper>
  )
}

export default ProjectsPage
