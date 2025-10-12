/**
 * Projects Page - Configure classification projects
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Spinner, Button, Card, Input } from '@/shared/ui'
import { projectService } from '@/features/projects/api/projectService'
import { ProjectCard, ProjectForm } from '@/features/projects/components'
import type { ProjectConfig, ProjectListResponse } from '@/features/projects/types'
import toast from 'react-hot-toast'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const ProjectsPage = () => {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectConfig | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch projects
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
      toast.success('Project created successfully')
      setFormOpen(false)
      setSelectedProject(undefined)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create project')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      projectService.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project updated successfully')
      setFormOpen(false)
      setSelectedProject(undefined)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update project')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: projectService.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete project')
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

  const handleDelete = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteMutation.mutate(projectId)
    }
  }

  const handleSubmit = (data: any) => {
    if (selectedProject) {
      updateMutation.mutate({ id: selectedProject.id, data })
    } else {
      createMutation.mutate(data)
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
        <h1 className="text-3xl font-bold">Projects</h1>
        <Card className="p-6 border-destructive">
          <div className="flex items-start gap-3">
            <div className="text-destructive text-lg">⚠️</div>
            <div>
              <p className="font-semibold text-destructive mb-1">Error loading data</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Configure classification projects for AI analysis
          </p>
        </div>
        <Button onClick={handleCreate}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by name, keywords, or components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          Showing {filteredProjects.length} of {totalProjects} projects
        </div>
      </Card>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">No projects found</p>
            <p className="text-sm">
              {totalProjects === 0
                ? 'Create your first project to get started'
                : 'Try adjusting your search query'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        project={selectedProject}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}

export default ProjectsPage
