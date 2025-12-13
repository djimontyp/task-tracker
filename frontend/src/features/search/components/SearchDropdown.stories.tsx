import type { Meta, StoryObj } from '@storybook/react'
import { SearchDropdown } from './SearchDropdown'
import type { FTSSearchResultsResponse } from '../types/fts'

const meta: Meta<typeof SearchDropdown> = {
  title: 'Features/Search/SearchDropdown',
  component: SearchDropdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SearchDropdown>

const mockResults: FTSSearchResultsResponse = {
  query: 'authentication',
  total_results: 7,
  topics: [
    {
      id: '1',
      name: 'User Authentication',
      description: 'OAuth and JWT authentication flows',
      match_snippet: 'OAuth and JWT <mark>authentication</mark> flows',
      rank: 0.95,
    },
    {
      id: '2',
      name: 'Security Best Practices',
      description: 'Authentication and authorization patterns',
      match_snippet: '<mark>Authentication</mark> and authorization patterns',
      rank: 0.85,
    },
  ],
  messages: [
    {
      id: '1',
      content_snippet: 'We need to implement <mark>authentication</mark> for the new API endpoints',
      author: 'John Doe',
      timestamp: new Date().toISOString(),
      topic: { id: '1', name: 'API Development' },
      rank: 0.92,
    },
    {
      id: '2',
      content_snippet: 'The <mark>authentication</mark> middleware is ready for review',
      author: 'Jane Smith',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      topic: { id: '2', name: 'Backend' },
      rank: 0.88,
    },
  ],
  atoms: [
    {
      id: '1',
      title: 'JWT Token Validation',
      content_snippet: 'Implement <mark>authentication</mark> token validation',
      type: 'solution',
      user_approved: true,
      rank: 0.90,
    },
    {
      id: '2',
      title: 'Security Question',
      content_snippet: 'How should we handle <mark>authentication</mark> failures?',
      type: 'question',
      user_approved: false,
      rank: 0.75,
    },
    {
      id: '3',
      title: 'Auth Architecture Decision',
      content_snippet: 'We decided to use OAuth2 for <mark>authentication</mark>',
      type: 'decision',
      user_approved: true,
      rank: 0.70,
    },
  ],
}

export const WithResults: Story = {
  args: {
    data: mockResults,
    isLoading: false,
    isDebouncing: false,
    query: 'authentication',
  },
}

export const Loading: Story = {
  args: {
    data: undefined,
    isLoading: true,
    isDebouncing: false,
    query: 'searching...',
  },
}

export const Debouncing: Story = {
  args: {
    data: undefined,
    isLoading: false,
    isDebouncing: true,
    query: 'typing...',
  },
}

export const NoResults: Story = {
  args: {
    data: {
      query: 'xyzzy12345',
      total_results: 0,
      topics: [],
      messages: [],
      atoms: [],
    },
    isLoading: false,
    isDebouncing: false,
    query: 'xyzzy12345',
  },
}

export const OnlyMessages: Story = {
  args: {
    data: {
      query: 'api',
      total_results: 2,
      topics: [],
      messages: mockResults.messages,
      atoms: [],
    },
    isLoading: false,
    isDebouncing: false,
    query: 'api',
  },
}

export const OnlyAtoms: Story = {
  args: {
    data: {
      query: 'jwt',
      total_results: 3,
      topics: [],
      messages: [],
      atoms: mockResults.atoms,
    },
    isLoading: false,
    isDebouncing: false,
    query: 'jwt',
  },
}

export const OnlyTopics: Story = {
  args: {
    data: {
      query: 'security',
      total_results: 2,
      topics: mockResults.topics,
      messages: [],
      atoms: [],
    },
    isLoading: false,
    isDebouncing: false,
    query: 'security',
  },
}
