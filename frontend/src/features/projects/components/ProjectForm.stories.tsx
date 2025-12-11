/**
 * ProjectForm Stories
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProjectForm } from './ProjectForm'
import type { ProjectConfig } from '../types'

const meta: Meta<typeof ProjectForm> = {
  title: 'Features/Projects/ProjectForm',
  component: ProjectForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}

export default meta

type Story = StoryObj<typeof ProjectForm>

const existingProject: ProjectConfig = {
  id: '1',
  name: 'Task Tracker Frontend',
  description: 'React-based frontend for task management',
  keywords: ['react', 'typescript', 'vite'],
  glossary: {
    'Component': 'Reusable UI element',
    'Hook': 'React function for state logic',
  },
  components: [
    {
      name: 'Frontend',
      keywords: ['react', 'vite'],
      description: 'User interface',
    },
  ],
  default_assignee_ids: [10, 20],
  pm_user_id: 5,
  is_active: true,
  priority_rules: {
    critical_keywords: ['production', 'security'],
    high_keywords: ['bug', 'error'],
  },
  version: '1.0.0',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T14:30:00Z',
}

export const CreateMode: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onSubmit: () => {},
  },
}

export const EditMode: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onSubmit: () => {},
    project: existingProject,
  },
}

export const WithValidation: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onSubmit: (data) => {
      if (!data.name.trim()) {
        alert('Project name is required!')
        return
      }
      if (!data.pm_user_id || data.pm_user_id <= 0) {
        alert('Project Manager ID must be greater than 0!')
        return
      }
      alert('Valid submission!')
    },
  },
}

export const Loading: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onSubmit: () => {},
    project: existingProject,
    isLoading: true,
  },
}

export const MinimalData: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onSubmit: () => {},
    project: {
      id: '2',
      name: 'Minimal Project',
      description: '',
      keywords: [],
      glossary: {},
      components: [],
      default_assignee_ids: [],
      pm_user_id: 1,
      is_active: true,
      priority_rules: {},
      version: '1.0.0',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
  },
}

export const FullyPopulated: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onSubmit: () => {},
    project: {
      ...existingProject,
      description: 'Comprehensive task management system with AI capabilities',
      keywords: ['react', 'typescript', 'ai', 'websocket', 'fastapi'],
      components: [
        {
          name: 'Frontend',
          keywords: ['react', 'vite', 'typescript'],
          description: 'User-facing web application',
        },
        {
          name: 'Backend',
          keywords: ['fastapi', 'python', 'postgresql'],
          description: 'REST API and business logic',
        },
        {
          name: 'Worker',
          keywords: ['taskiq', 'ai', 'embeddings'],
          description: 'Background task processor',
        },
      ],
      glossary: {
        'AI Agent': 'Autonomous software entity',
        'Embedding': 'Vector representation of text',
        'RAG': 'Retrieval Augmented Generation',
      },
      default_assignee_ids: [10, 20, 30],
      priority_rules: {
        critical_keywords: ['production', 'security', 'data loss'],
        high_keywords: ['bug', 'error', 'crash'],
        medium_keywords: ['feature', 'enhancement'],
        low_keywords: ['documentation', 'refactor'],
      },
    },
  },
}

export const Closed: Story = {
  args: {
    open: false,
    onOpenChange: () => {},
    onSubmit: () => {},
  },
}

export const InactiveProject: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    onSubmit: () => {},
    project: {
      ...existingProject,
      is_active: false,
    },
  },
}
