import type { Meta, StoryObj } from '@storybook/react-vite';
import { TopicSearchItem } from './TopicSearchItem';
import { Command, CommandList, CommandGroup } from '@/shared/ui/command';
import type { FTSTopicResult } from './types/fts';

const meta: Meta<typeof TopicSearchItem> = {
  title: 'Components/SearchBar/TopicSearchItem',
  component: TopicSearchItem,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Command className="w-80 border rounded-lg">
        <CommandList>
          <CommandGroup>
            <Story />
          </CommandGroup>
        </CommandList>
      </Command>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Search result item for topics. Shows folder icon, topic name, and optional description with highlights.',
      },
    },
  },
  argTypes: {
    onSelect: {
      action: 'selected',
      description: 'Callback when item is selected',
    },
  },
};
export default meta;

type Story = StoryObj<typeof TopicSearchItem>;

const createTopic = (
  name: string,
  description: string | null,
  snippet: string
): FTSTopicResult => ({
  id: `topic-${name.toLowerCase().replace(/\s+/g, '-')}`,
  name,
  description,
  match_snippet: snippet,
  rank: 1,
});

export const Default: Story = {
  args: {
    topic: createTopic(
      'Frontend Development',
      'React, TypeScript, and CSS topics',
      '<mark>Frontend</mark> patterns and best practices'
    ),
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Topic with name, description, and highlighted snippet.',
      },
    },
  },
};

export const WithoutDescription: Story = {
  args: {
    topic: createTopic('Backend API', null, ''),
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Topic without description - shows only name.',
      },
    },
  },
};

export const LongName: Story = {
  args: {
    topic: createTopic(
      'Mobile Application Development for iOS and Android Platforms',
      'Cross-platform development',
      '<mark>Mobile</mark> development guidelines'
    ),
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Topic with a long name.',
      },
    },
  },
};

export const HighlightedName: Story = {
  args: {
    topic: createTopic(
      'React Patterns',
      'Common patterns in React development',
      '<mark>React</mark> component <mark>patterns</mark> and hooks'
    ),
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Topic with multiple highlighted terms.',
      },
    },
  },
};

export const MultipleTopics: Story = {
  render: () => (
    <Command className="w-96 border rounded-lg">
      <CommandList>
        <CommandGroup heading="Topics (5)">
          <TopicSearchItem
            topic={createTopic(
              'Frontend',
              'React and TypeScript',
              '<mark>Frontend</mark> development'
            )}
            onSelect={() => {}}
          />
          <TopicSearchItem
            topic={createTopic(
              'Backend',
              'Python and FastAPI',
              '<mark>Backend</mark> services'
            )}
            onSelect={() => {}}
          />
          <TopicSearchItem
            topic={createTopic(
              'Infrastructure',
              'Docker and Kubernetes',
              '<mark>Infrastructure</mark> as code'
            )}
            onSelect={() => {}}
          />
          <TopicSearchItem
            topic={createTopic(
              'Testing',
              'Unit and E2E testing',
              '<mark>Testing</mark> strategies'
            )}
            onSelect={() => {}}
          />
          <TopicSearchItem
            topic={createTopic(
              'Documentation',
              'MkDocs and Storybook',
              '<mark>Documentation</mark> standards'
            )}
            onSelect={() => {}}
          />
        </CommandGroup>
      </CommandList>
    </Command>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple topic items in a list.',
      },
    },
  },
};

export const MinimalTopic: Story = {
  args: {
    topic: {
      id: 'topic-minimal',
      name: 'Quick Notes',
      description: null,
      match_snippet: '',
      rank: 1,
    },
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal topic with only name, no description or snippet.',
      },
    },
  },
};
