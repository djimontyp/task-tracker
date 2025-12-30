import type { Meta, StoryObj } from '@storybook/react-vite';
import { MessageSearchItem } from './MessageSearchItem';
import { Command, CommandList, CommandGroup } from '@/shared/ui/command';
import type { FTSMessageResult } from './types/fts';

const meta: Meta<typeof MessageSearchItem> = {
  title: 'Components/SearchBar/MessageSearchItem',
  component: MessageSearchItem,
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
          'Search result item for messages. Shows icon, content snippet with highlights, author, timestamp, and optional topic.',
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

type Story = StoryObj<typeof MessageSearchItem>;

const createMessage = (
  content: string,
  author: string,
  hoursAgo: number = 0,
  topic?: { id: string; name: string }
): FTSMessageResult => ({
  id: `msg-${Date.now()}`,
  content_snippet: content,
  author,
  timestamp: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
  topic: topic || null,
  rank: 1,
});

export const Default: Story = {
  args: {
    message: createMessage(
      'Discussing <mark>React</mark> performance improvements',
      'John Doe',
      1,
      { id: 'topic-1', name: 'Frontend' }
    ),
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Message search item with topic and highlighted content.',
      },
    },
  },
};

export const WithoutTopic: Story = {
  args: {
    message: createMessage(
      'Quick update on the <mark>deployment</mark> status',
      'Jane Smith',
      2
    ),
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Message without an associated topic.',
      },
    },
  },
};

export const RecentMessage: Story = {
  args: {
    message: createMessage(
      'Just pushed the fix for <mark>bug</mark> #123',
      'Bob Wilson',
      0,
      { id: 'topic-2', name: 'Bug Fixes' }
    ),
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Very recent message - shows "less than a minute ago".',
      },
    },
  },
};

export const OldMessage: Story = {
  args: {
    message: createMessage(
      'Initial <mark>architecture</mark> discussion from last month',
      'Alice Brown',
      720, // 30 days
      { id: 'topic-3', name: 'Architecture' }
    ),
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Older message showing date format.',
      },
    },
  },
};

export const MultilineContent: Story = {
  args: {
    message: createMessage(
      'This is a longer message that spans multiple lines. We are discussing the <mark>implementation</mark> of the new feature and how it should integrate with the existing <mark>codebase</mark>.',
      'Chris Lee',
      3,
      { id: 'topic-4', name: 'Development' }
    ),
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Long content with 2-line clamp.',
      },
    },
  },
};

export const LongTopicName: Story = {
  args: {
    message: createMessage(
      'Working on the <mark>API</mark> integration',
      'Dev Team',
      5,
      { id: 'topic-5', name: 'Backend API Integration Project' }
    ),
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Topic name with truncation.',
      },
    },
  },
};

export const MultipleMessages: Story = {
  render: () => (
    <Command className="w-96 border rounded-lg">
      <CommandList>
        <CommandGroup heading="Messages (4)">
          <MessageSearchItem
            message={createMessage(
              'Setting up the <mark>CI/CD</mark> pipeline',
              'DevOps Team',
              1,
              { id: 'topic-1', name: 'Infrastructure' }
            )}
            onSelect={() => {}}
          />
          <MessageSearchItem
            message={createMessage(
              'Code review for <mark>authentication</mark> module',
              'Security Team',
              4
            )}
            onSelect={() => {}}
          />
          <MessageSearchItem
            message={createMessage(
              'Planning the <mark>Q1</mark> roadmap',
              'Product Manager',
              24,
              { id: 'topic-2', name: 'Planning' }
            )}
            onSelect={() => {}}
          />
          <MessageSearchItem
            message={createMessage(
              'Discussion about <mark>testing</mark> strategies',
              'QA Team',
              48,
              { id: 'topic-3', name: 'Quality Assurance' }
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
        story: 'Multiple message items in a list context.',
      },
    },
  },
};
