import type { Meta, StoryObj } from '@storybook/react-vite';
import { AtomSearchItem } from './AtomSearchItem';
import { Command, CommandList, CommandGroup } from '@/shared/ui/command';
import type { FTSAtomResult, FTSAtomType } from './types/fts';

const meta: Meta<typeof AtomSearchItem> = {
  title: 'Components/SearchBar/AtomSearchItem',
  component: AtomSearchItem,
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
          'Search result item for atoms. Shows icon, title, content snippet with highlights, approval status, and type badge.',
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

type Story = StoryObj<typeof AtomSearchItem>;

const createAtom = (
  type: FTSAtomType,
  title: string,
  content: string,
  approved: boolean = false
): FTSAtomResult => ({
  id: `atom-${type}`,
  type,
  title,
  content_snippet: content,
  user_approved: approved,
  rank: 1,
});

export const Insight: Story = {
  args: {
    atom: createAtom(
      'insight',
      'React Hooks Best Practices',
      'Using <mark>useCallback</mark> for memoization',
      true
    ),
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Approved insight atom with highlighted content.',
      },
    },
  },
};

export const Decision: Story = {
  args: {
    atom: createAtom(
      'decision',
      'State Management Choice',
      'We chose <mark>Zustand</mark> over Redux for simplicity',
      true
    ),
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Decision atom with approval badge.',
      },
    },
  },
};

export const Problem: Story = {
  args: {
    atom: createAtom(
      'problem',
      'Memory Leak in useEffect',
      '<mark>Memory leak</mark> when component unmounts',
      false
    ),
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Problem atom without approval.',
      },
    },
  },
};

export const Solution: Story = {
  args: {
    atom: createAtom(
      'solution',
      'Fix Memory Leak',
      'Add cleanup function in <mark>useEffect</mark>',
      true
    ),
    onSelect: () => {},
  },
};

export const Question: Story = {
  args: {
    atom: createAtom(
      'question',
      'Performance Optimization',
      'Should we use <mark>useMemo</mark> for complex calculations?',
      false
    ),
    onSelect: () => {},
  },
};

export const Pattern: Story = {
  args: {
    atom: createAtom(
      'pattern',
      'Custom Hook Pattern',
      '<mark>useLocalStorage</mark> hook for persistent state',
      true
    ),
    onSelect: () => {},
  },
};

export const Requirement: Story = {
  args: {
    atom: createAtom(
      'requirement',
      'API Response Time',
      'All <mark>API</mark> calls must complete within 200ms',
      true
    ),
    onSelect: () => {},
  },
};

export const AllTypes: Story = {
  render: () => {
    const types: FTSAtomType[] = [
      'problem',
      'solution',
      'decision',
      'question',
      'insight',
      'pattern',
      'requirement',
    ];

    return (
      <Command className="w-96 border rounded-lg">
        <CommandList>
          <CommandGroup heading="All Atom Types">
            {types.map((type) => (
              <AtomSearchItem
                key={type}
                atom={createAtom(type, `${type.charAt(0).toUpperCase()}${type.slice(1)} Example`, `This is a <mark>${type}</mark> atom`, type !== 'question')}
                onSelect={() => {}}
              />
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'All atom types with their distinctive badge colors.',
      },
    },
  },
};

export const LongContent: Story = {
  args: {
    atom: {
      id: 'atom-long',
      type: 'insight',
      title: 'Very Long Title That Should Be Truncated When It Exceeds Container Width',
      content_snippet:
        'This is a very long content snippet that contains <mark>highlighted</mark> text and should be <mark>truncated</mark> to show only one line with ellipsis at the end',
      user_approved: true,
      rank: 1,
    },
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Handling of long title and content with truncation.',
      },
    },
  },
};
