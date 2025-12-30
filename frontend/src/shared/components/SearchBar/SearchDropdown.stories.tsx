import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchDropdown } from './SearchDropdown';
import type { FTSSearchResultsResponse } from './types/fts';

const meta: Meta<typeof SearchDropdown> = {
  title: 'Components/SearchBar/SearchDropdown',
  component: SearchDropdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dropdown showing search results grouped by type (Messages, Atoms, Topics). Includes loading skeleton and empty state.',
      },
    },
  },
  argTypes: {
    query: {
      control: 'text',
      description: 'Current search query',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether search is loading',
    },
    isDebouncing: {
      control: 'boolean',
      description: 'Whether input is debouncing',
    },
  },
};
export default meta;

type Story = StoryObj<typeof SearchDropdown>;

const mockData: FTSSearchResultsResponse = {
  query: 'react hooks',
  total_results: 5,
  messages: [
    {
      id: 'msg-1',
      content_snippet: 'Using <mark>React</mark> <mark>hooks</mark> for state management',
      author: 'John Doe',
      timestamp: new Date().toISOString(),
      topic: { id: 'topic-1', name: 'Frontend' },
      rank: 1,
    },
    {
      id: 'msg-2',
      content_snippet: 'Custom <mark>hooks</mark> best practices in <mark>React</mark>',
      author: 'Jane Smith',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      topic: null,
      rank: 2,
    },
  ],
  atoms: [
    {
      id: 'atom-1',
      type: 'insight',
      title: 'React Hooks Pattern',
      content_snippet: 'Best practices for <mark>React</mark> <mark>hooks</mark> implementation',
      user_approved: true,
      rank: 1,
    },
    {
      id: 'atom-2',
      type: 'decision',
      title: 'State Management Choice',
      content_snippet: 'We decided to use <mark>React</mark> Query over Redux',
      user_approved: false,
      rank: 2,
    },
  ],
  topics: [
    {
      id: 'topic-1',
      name: 'React Development',
      description: 'Frontend development with React',
      match_snippet: '<mark>React</mark> frontend patterns',
      rank: 1,
    },
  ],
};

export const WithResults: Story = {
  args: {
    data: mockData,
    isLoading: false,
    isDebouncing: false,
    query: 'react hooks',
    onSelectMessage: () => {},
    onSelectAtom: () => {},
    onSelectTopic: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Dropdown with search results in all categories.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    data: undefined,
    isLoading: true,
    isDebouncing: false,
    query: 'react hooks',
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with skeleton placeholders.',
      },
    },
  },
};

export const Debouncing: Story = {
  args: {
    data: undefined,
    isLoading: false,
    isDebouncing: true,
    query: 'react',
  },
  parameters: {
    docs: {
      description: {
        story: 'Debouncing state - shows loading skeleton while waiting for user to stop typing.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    data: {
      query: 'xyz123',
      total_results: 0,
      messages: [],
      atoms: [],
      topics: [],
    },
    isLoading: false,
    isDebouncing: false,
    query: 'xyz123',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no results match the query.',
      },
    },
  },
};

export const MessagesOnly: Story = {
  args: {
    data: {
      query: 'bug report',
      total_results: 2,
      messages: mockData.messages,
      atoms: [],
      topics: [],
    },
    isLoading: false,
    isDebouncing: false,
    query: 'bug report',
    onSelectMessage: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Results with only messages.',
      },
    },
  },
};

export const AtomsOnly: Story = {
  args: {
    data: {
      query: 'pattern',
      total_results: 2,
      messages: [],
      atoms: mockData.atoms,
      topics: [],
    },
    isLoading: false,
    isDebouncing: false,
    query: 'pattern',
    onSelectAtom: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Results with only atoms.',
      },
    },
  },
};

export const TopicsOnly: Story = {
  args: {
    data: {
      query: 'frontend',
      total_results: 1,
      messages: [],
      atoms: [],
      topics: mockData.topics,
    },
    isLoading: false,
    isDebouncing: false,
    query: 'frontend',
    onSelectTopic: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Results with only topics.',
      },
    },
  },
};

export const ManyResults: Story = {
  args: {
    data: {
      query: 'test',
      total_results: 15,
      messages: Array.from({ length: 5 }, (_, i) => ({
        id: `msg-${i}`,
        content_snippet: `<mark>Test</mark> message content ${i + 1}`,
        author: `Author ${i + 1}`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        topic: i % 2 === 0 ? { id: 'topic-1', name: 'Testing' } : null,
        rank: i + 1,
      })),
      atoms: Array.from({ length: 5 }, (_, i) => ({
        id: `atom-${i}`,
        type: ['insight', 'decision', 'problem', 'solution', 'question'][i % 5] as 'insight',
        title: `Test Atom ${i + 1}`,
        content_snippet: `<mark>Test</mark> atom content ${i + 1}`,
        user_approved: i % 2 === 0,
        rank: i + 1,
      })),
      topics: Array.from({ length: 5 }, (_, i) => ({
        id: `topic-${i}`,
        name: `Test Topic ${i + 1}`,
        description: `Description for topic ${i + 1}`,
        match_snippet: `<mark>Test</mark> topic snippet ${i + 1}`,
        rank: i + 1,
      })),
    },
    isLoading: false,
    isDebouncing: false,
    query: 'test',
    onSelectMessage: () => {},
    onSelectAtom: () => {},
    onSelectTopic: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Scrollable dropdown with many results in all categories.',
      },
    },
  },
};
