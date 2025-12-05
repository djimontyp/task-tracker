/**
 * ProjectCard Stories
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProjectCard } from './ProjectCard'
import type { ProjectConfig } from '../types'

const meta: Meta<typeof ProjectCard> = {
  title: 'Features/ProjectCard',
  component: ProjectCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-3xl">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof ProjectCard>

const baseProject: ProjectConfig = {
  id: '1',
  name: 'Task Tracker Frontend',
  description: 'React-based frontend for task management system',
  keywords: ['react', 'typescript', 'vite'],
  glossary: {},
  components: [],
  default_assignee_ids: [],
  pm_user_id: 1,
  is_active: true,
  priority_rules: {},
  version: '1.0.0',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T14:30:00Z',
}

export const Default: Story = {
  args: {
    project: baseProject,
  },
}

export const WithKeywords: Story = {
  args: {
    project: {
      ...baseProject,
      keywords: ['react', 'typescript', 'vite', 'tailwindcss', 'zustand', 'tanstack-query'],
    },
  },
}

export const WithDescription: Story = {
  args: {
    project: {
      ...baseProject,
      description:
        'A comprehensive task management system built with React 18 and TypeScript. Features include real-time updates via WebSocket, advanced filtering, and AI-powered task classification. The system supports multiple users, projects, and custom workflows.',
    },
  },
}

export const Active: Story = {
  args: {
    project: {
      ...baseProject,
      is_active: true,
    },
  },
}

export const Inactive: Story = {
  args: {
    project: {
      ...baseProject,
      is_active: false,
    },
  },
}

export const WithComponents: Story = {
  args: {
    project: {
      ...baseProject,
      components: [
        {
          name: 'Frontend',
          keywords: ['react', 'vite', 'typescript'],
          description: 'User-facing web application',
        },
        {
          name: 'Backend API',
          keywords: ['fastapi', 'python', 'postgresql'],
          description: 'REST API and business logic',
        },
        {
          name: 'Worker',
          keywords: ['taskiq', 'ai', 'embeddings'],
        },
      ],
    },
  },
}

export const WithGlossary: Story = {
  args: {
    project: {
      ...baseProject,
      glossary: {
        'AI Agent': 'Autonomous software entity that performs tasks using LLMs',
        'Embedding': 'Vector representation of text for semantic search',
        'RAG': 'Retrieval Augmented Generation for context-aware LLM responses',
      },
    },
  },
}

export const WithPriorityRules: Story = {
  args: {
    project: {
      ...baseProject,
      priority_rules: {
        critical_keywords: ['production', 'security', 'data loss'],
        high_keywords: ['bug', 'error', 'crash'],
        medium_keywords: ['feature', 'enhancement'],
        low_keywords: ['documentation', 'refactor'],
      },
    },
  },
}

export const WithAssignees: Story = {
  args: {
    project: {
      ...baseProject,
      default_assignee_ids: [10, 20, 30, 40],
      pm_user_id: 5,
    },
  },
}

export const FullyPopulated: Story = {
  args: {
    project: {
      ...baseProject,
      description: 'Complete project configuration with all features enabled',
      keywords: ['react', 'typescript', 'ai', 'websocket'],
      components: [
        {
          name: 'Frontend',
          keywords: ['react', 'vite'],
          description: 'User interface',
        },
        {
          name: 'Backend',
          keywords: ['fastapi', 'python'],
          description: 'API server',
        },
      ],
      glossary: {
        'Agent': 'AI-powered task executor',
        'Topic': 'Category for organizing atoms',
      },
      priority_rules: {
        critical_keywords: ['production', 'security'],
        high_keywords: ['bug', 'error'],
      },
      default_assignee_ids: [10, 20],
      pm_user_id: 5,
    },
  },
}

export const WithActions: Story = {
  args: {
    project: baseProject,
    onEdit: (project) => alert(`Edit project: ${project.name}`),
    onDelete: (projectId) => alert(`Delete project: ${projectId}`),
  },
}

export const Loading: Story = {
  args: {
    project: baseProject,
    onEdit: () => {},
    onDelete: () => {},
    isLoading: true,
  },
}

export const MobileView: Story = {
  args: {
    project: {
      ...baseProject,
      keywords: ['react', 'typescript', 'vite'],
      components: [
        {
          name: 'Frontend',
          keywords: ['react', 'vite'],
        },
      ],
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}
