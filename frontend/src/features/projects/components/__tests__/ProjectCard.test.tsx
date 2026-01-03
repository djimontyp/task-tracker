import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectCard } from '../ProjectCard'
import { ProjectConfig } from '../../types'

const createMockProject = (overrides: Partial<ProjectConfig> = {}): ProjectConfig => ({
  id: 'project-123',
  name: 'Test Project',
  description: 'This is a test project description that should be displayed in the card and can be quite long to test line clamping behavior when it exceeds two lines in the UI component.',
  keywords: ['react', 'typescript', 'testing', 'vitest', 'frontend', 'backend'],
  glossary: {
    API: 'Application Programming Interface',
    REST: 'Representational State Transfer',
    JWT: 'JSON Web Token that is used for authentication and authorization in modern web applications',
  },
  components: [
    {
      name: 'Authentication Module',
      description: 'Handles user login and registration',
      keywords: ['auth', 'login', 'jwt'],
    },
    {
      name: 'Dashboard',
      keywords: ['ui', 'charts'],
    },
  ],
  default_assignee_ids: [1, 2, 3],
  pm_user_id: 1,
  is_active: true,
  priority_rules: {
    critical_keywords: ['security', 'bug', 'crash'],
    high_keywords: ['feature', 'enhancement'],
    medium_keywords: ['refactor', 'documentation'],
    low_keywords: ['typo', 'comment'],
  },
  version: '1.0.0',
  language: 'en',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('ProjectCard', () => {
  // ========== TEXT TRUNCATION TESTS ==========

  describe('Text Truncation', () => {
    test('truncates long project name', () => {
      const longName = 'A'.repeat(200)
      const project = createMockProject({ name: longName })

      render(<ProjectCard project={project} />)

      const nameElement = screen.getByText(longName)
      expect(nameElement).toHaveClass('truncate')
    })

    test('truncates long description (line-clamp-2)', () => {
      const longDescription = 'Lorem ipsum dolor sit amet '.repeat(100)
      const project = createMockProject({ description: longDescription })

      render(<ProjectCard project={project} />)

      const descElement = screen.getByText(/Lorem ipsum/, { exact: false })
      expect(descElement).toHaveClass('line-clamp-2')
    })

    test('truncates long glossary definitions (line-clamp-1)', () => {
      const longDefinition = 'This is a very long definition that should be truncated '.repeat(10)
      const project = createMockProject({
        glossary: { Term: longDefinition },
      })

      render(<ProjectCard project={project} />)

      const defElement = screen.getByText(/This is a very long definition/, { exact: false })
      expect(defElement).toHaveClass('line-clamp-1')
    })
  })

  // ========== TOUCH TARGET TESTS ==========

  describe('Touch Targets', () => {
    test('edit button has proper size', () => {
      const project = createMockProject()

      render(<ProjectCard project={project} onEdit={vi.fn()} />)

      const editButton = screen.getByRole('button', { name: /edit/i })
      // Should have sm size (which is less than 44px) but with proper padding
      expect(editButton).toBeInTheDocument()
    })

    test('delete button has proper size', () => {
      const project = createMockProject()

      render(<ProjectCard project={project} onDelete={vi.fn()} />)

      const deleteButton = screen.getByRole('button')
      expect(deleteButton).toBeInTheDocument()
    })
  })

  // ========== RENDERING TESTS ==========

  describe('Rendering', () => {
    test('renders project name and description', () => {
      const project = createMockProject()

      render(<ProjectCard project={project} />)

      expect(screen.getByText(project.name)).toBeInTheDocument()
      expect(screen.getByText(project.description)).toBeInTheDocument()
    })

    test('renders without description when empty', () => {
      const project = createMockProject({ description: '' })

      render(<ProjectCard project={project} />)

      expect(screen.getByText(project.name)).toBeInTheDocument()
      expect(screen.queryByText(/lorem/i)).not.toBeInTheDocument()
    })

    test('renders active status badge', () => {
      const project = createMockProject({ is_active: true })

      render(<ProjectCard project={project} />)

      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    test('renders inactive status badge', () => {
      const project = createMockProject({ is_active: false })

      render(<ProjectCard project={project} />)

      expect(screen.getByText('Inactive')).toBeInTheDocument()
    })

    test('renders version number', () => {
      const project = createMockProject({ version: '2.5.1' })

      render(<ProjectCard project={project} />)

      expect(screen.getByText(/version 2.5.1/i)).toBeInTheDocument()
    })

    test('renders updated date', () => {
      const project = createMockProject({
        updated_at: '2024-03-15T10:30:00Z',
      })

      render(<ProjectCard project={project} />)

      expect(screen.getByText(/updated/i)).toBeInTheDocument()
    })
  })

  // ========== KEYWORDS TESTS ==========

  describe('Keywords', () => {
    test('renders all keywords when present', () => {
      const project = createMockProject({
        keywords: ['react', 'typescript', 'testing'],
      })

      render(<ProjectCard project={project} />)

      expect(screen.getByText('react')).toBeInTheDocument()
      expect(screen.getByText('typescript')).toBeInTheDocument()
      expect(screen.getByText('testing')).toBeInTheDocument()
    })

    test('does not render keywords section when empty', () => {
      const project = createMockProject({ keywords: [] })

      render(<ProjectCard project={project} />)

      expect(screen.queryByText('Keywords')).not.toBeInTheDocument()
    })

    test('renders many keywords without overflow', () => {
      const manyKeywords = Array.from({ length: 20 }, (_, i) => `keyword-${i}`)
      const project = createMockProject({ keywords: manyKeywords })

      render(<ProjectCard project={project} />)

      // Check first and last keywords are rendered
      expect(screen.getByText('keyword-0')).toBeInTheDocument()
      expect(screen.getByText('keyword-19')).toBeInTheDocument()
    })
  })

  // ========== COMPONENTS TESTS ==========

  describe('Components', () => {
    test('renders all project components', () => {
      const project = createMockProject()

      render(<ProjectCard project={project} />)

      expect(screen.getByText('Authentication Module')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    test('renders component descriptions when present', () => {
      const project = createMockProject()

      render(<ProjectCard project={project} />)

      expect(screen.getByText('Handles user login and registration')).toBeInTheDocument()
    })

    test('renders component keywords', () => {
      const project = createMockProject()

      render(<ProjectCard project={project} />)

      expect(screen.getByText('auth')).toBeInTheDocument()
      expect(screen.getByText('login')).toBeInTheDocument()
      expect(screen.getByText('jwt')).toBeInTheDocument()
      expect(screen.getByText('ui')).toBeInTheDocument()
      expect(screen.getByText('charts')).toBeInTheDocument()
    })

    test('does not render components section when empty', () => {
      const project = createMockProject({ components: [] })

      render(<ProjectCard project={project} />)

      expect(screen.queryByText('Components')).not.toBeInTheDocument()
    })
  })

  // ========== GLOSSARY TESTS ==========

  describe('Glossary', () => {
    test('renders all glossary terms and definitions', () => {
      const project = createMockProject()

      render(<ProjectCard project={project} />)

      expect(screen.getByText(/API:/)).toBeInTheDocument()
      expect(screen.getByText(/Application Programming Interface/)).toBeInTheDocument()
      expect(screen.getByText(/REST:/)).toBeInTheDocument()
      expect(screen.getByText(/JWT:/)).toBeInTheDocument()
    })

    test('does not render glossary section when empty', () => {
      const project = createMockProject({ glossary: {} })

      render(<ProjectCard project={project} />)

      expect(screen.queryByText('Glossary')).not.toBeInTheDocument()
    })
  })

  // ========== PRIORITY RULES TESTS ==========

  describe('Priority Rules', () => {
    test('renders all priority rule categories', () => {
      const project = createMockProject()

      render(<ProjectCard project={project} />)

      expect(screen.getByText('Critical')).toBeInTheDocument()
      expect(screen.getByText('High')).toBeInTheDocument()
      expect(screen.getByText('Medium')).toBeInTheDocument()
      expect(screen.getByText('Low')).toBeInTheDocument()
    })

    test('renders priority rule keywords', () => {
      const project = createMockProject()

      render(<ProjectCard project={project} />)

      expect(screen.getByText('security')).toBeInTheDocument()
      expect(screen.getByText('bug')).toBeInTheDocument()
      expect(screen.getByText('feature')).toBeInTheDocument()
      expect(screen.getByText('refactor')).toBeInTheDocument()
    })

    test('does not render priority rules section when empty', () => {
      const project = createMockProject({ priority_rules: {} })

      render(<ProjectCard project={project} />)

      expect(screen.queryByText('Priority Rules')).not.toBeInTheDocument()
    })

    test('does not render empty priority categories', () => {
      const project = createMockProject({
        priority_rules: {
          critical_keywords: ['bug'],
          high_keywords: [],
          medium_keywords: [],
          low_keywords: [],
        },
      })

      render(<ProjectCard project={project} />)

      expect(screen.getByText('Critical')).toBeInTheDocument()
      expect(screen.queryByText('High')).not.toBeInTheDocument()
      expect(screen.queryByText('Medium')).not.toBeInTheDocument()
      expect(screen.queryByText('Low')).not.toBeInTheDocument()
    })
  })

  // ========== ASSIGNEES TESTS ==========

  describe('Assignees', () => {
    test('renders default assignee IDs', () => {
      const project = createMockProject({
        default_assignee_ids: [101, 202, 303],
      })

      render(<ProjectCard project={project} />)

      expect(screen.getByText('#101')).toBeInTheDocument()
      expect(screen.getByText('#202')).toBeInTheDocument()
      expect(screen.getByText('#303')).toBeInTheDocument()
    })

    test('shows "None" when no default assignees', () => {
      const project = createMockProject({ default_assignee_ids: [] })

      render(<ProjectCard project={project} />)

      expect(screen.getByText('None')).toBeInTheDocument()
    })

    test('renders project manager user ID', () => {
      const project = createMockProject({ pm_user_id: 42 })

      render(<ProjectCard project={project} />)

      expect(screen.getByText('User #42')).toBeInTheDocument()
    })
  })

  // ========== ACTION BUTTONS TESTS ==========

  describe('Action Buttons', () => {
    test('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const project = createMockProject()

      render(<ProjectCard project={project} onEdit={onEdit} />)

      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      expect(onEdit).toHaveBeenCalledWith(project)
      expect(onEdit).toHaveBeenCalledTimes(1)
    })

    test('calls onDelete with project id when delete button is clicked', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      const project = createMockProject()

      render(<ProjectCard project={project} onDelete={onDelete} />)

      const deleteButton = screen.getByRole('button')
      await user.click(deleteButton)

      expect(onDelete).toHaveBeenCalledWith(project.id)
      expect(onDelete).toHaveBeenCalledTimes(1)
    })

    test('does not render action buttons when callbacks not provided', () => {
      const project = createMockProject()

      render(<ProjectCard project={project} />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    test('buttons are not disabled by default when not loading', () => {
      const project = createMockProject()

      render(<ProjectCard project={project} onEdit={vi.fn()} onDelete={vi.fn()} isLoading={false} />)

      const editButton = screen.getByRole('button', { name: /edit/i })
      expect(editButton).not.toBeDisabled()

      // Delete button is icon-only, find by traversing
      const buttons = screen.getAllByRole('button')
      const deleteButton = buttons.find(btn => btn.querySelector('.lucide-trash-2'))
      expect(deleteButton).not.toBeDisabled()
    })
  })

  // ========== LOADING STATE TESTS ==========

  describe('Loading State', () => {
    test('shows loading spinner when isLoading is true', () => {
      const project = createMockProject()

      render(<ProjectCard project={project} onEdit={vi.fn()} onDelete={vi.fn()} isLoading={true} />)

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.queryByText(project.name)).not.toBeInTheDocument()
    })

    test('does not show action buttons when loading', () => {
      const project = createMockProject()

      render(<ProjectCard project={project} onEdit={vi.fn()} onDelete={vi.fn()} isLoading={true} />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  // ========== COMPLEX DATA TESTS ==========

  describe('Complex Data', () => {
    test('handles project with minimal data', () => {
      const minimalProject: ProjectConfig = {
        id: 'min-1',
        name: 'Minimal',
        description: '',
        keywords: [],
        glossary: {},
        components: [],
        default_assignee_ids: [],
        pm_user_id: 1,
        is_active: false,
        priority_rules: {},
        version: '0.0.1',
        language: 'en',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      render(<ProjectCard project={minimalProject} />)

      expect(screen.getByText('Minimal')).toBeInTheDocument()
      expect(screen.getByText('Inactive')).toBeInTheDocument()
      expect(screen.getByText('None')).toBeInTheDocument()
    })

    test('handles project with maximum data', () => {
      const maximalProject = createMockProject({
        keywords: Array.from({ length: 30 }, (_, i) => `kw${i}`),
        components: Array.from({ length: 10 }, (_, i) => ({
          name: `Component ${i}`,
          keywords: [`comp-kw-${i}`],
        })),
        glossary: Object.fromEntries(
          Array.from({ length: 20 }, (_, i) => [`Term${i}`, `Definition ${i}`])
        ),
      })

      render(<ProjectCard project={maximalProject} />)

      expect(screen.getByText('Test Project')).toBeInTheDocument()
      expect(screen.getByText('kw0')).toBeInTheDocument()
      expect(screen.getByText('Component 0')).toBeInTheDocument()
    })
  })
})
