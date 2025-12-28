import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useCallback } from 'react';
import { ReviewQueue, ReviewAtom, AtomType, ReviewStatus } from './ReviewQueue';

const meta: Meta<typeof ReviewQueue> = {
  title: 'Features/Extraction/ReviewQueue',
  component: ReviewQueue,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A keyboard-first triage interface for reviewing AI-extracted knowledge atoms.

## Features
- **Keyboard Navigation**: j/k for next/prev, a/r for approve/reject
- **Bulk Selection**: Shift+Click for range selection, Ctrl+A for select all
- **Context Panel**: Shows source message and AI reasoning
- **Progress Tracking**: Visual progress bar and counters

## Keyboard Shortcuts
| Key | Action |
|-----|--------|
| j / ArrowDown | Next atom |
| k / ArrowUp | Previous atom |
| a | Approve current |
| r | Reject current |
| Space | Toggle selection |
| Shift+Click | Range select |
| Ctrl/Cmd+A | Select all |
| ? | Show shortcuts help |

## Accessibility
- Screen reader announcements for actions
- Focus management
- WCAG AA compliant
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ReviewQueue>;

// Generate sample atoms
function generateAtoms(count: number): ReviewAtom[] {
  const types: AtomType[] = ['task', 'idea', 'question', 'decision', 'insight'];
  const titles = [
    'Migrate database to PostgreSQL 15',
    'Consider using Redis for caching',
    'Why is the build so slow?',
    'Use TypeScript strict mode',
    'Pattern: Repository pattern for data access',
    'Implement user authentication',
    'Explore WebSocket for real-time updates',
    'What about mobile support?',
    'Switch to Vite for faster builds',
    'Insight: Users prefer dark mode',
  ];

  const contents = [
    'We need to upgrade our database to get better JSON support and performance improvements.',
    'Redis could significantly improve our response times for frequently accessed data.',
    'The build takes over 5 minutes, which is affecting developer productivity.',
    'Strict mode catches more bugs at compile time and improves code quality.',
    'Implementing repository pattern will decouple our business logic from data access.',
    'JWT-based auth with refresh tokens would be secure and scalable.',
    'Real-time updates would improve UX for collaborative features.',
    'Mobile traffic is increasing, we should consider responsive design.',
    'Vite offers faster HMR and better dev experience than webpack.',
    '73% of users in our survey prefer dark mode, we should make it default.',
  ];

  const aiReasonings = [
    'This message contains a clear action item with specific technical requirements.',
    'The author is proposing a solution to an implicit performance problem.',
    'A question was asked that requires a decision or investigation.',
    'This is a team decision that affects code quality standards.',
    'The author identified a recurring pattern that could be documented.',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `atom-${i}`,
    type: types[i % types.length],
    title: titles[i % titles.length],
    content: contents[i % contents.length],
    sourceMessage: {
      text: `Original message about ${titles[i % titles.length].toLowerCase()}. Team discussion context here.`,
      author: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'][i % 5],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    },
    aiReasoning: aiReasonings[i % aiReasonings.length],
    confidence: 0.6 + Math.random() * 0.35,
    tags: ['frontend', 'backend', 'devops', 'ux', 'security'].slice(0, 1 + (i % 3)),
    status: 'pending' as ReviewStatus,
  }));
}

// Interactive wrapper with state management
function ReviewQueueDemo({ initialAtoms }: { initialAtoms: ReviewAtom[] }) {
  const [atoms, setAtoms] = useState(initialAtoms);

  const handleApprove = useCallback((id: string) => {
    setAtoms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'approved' as ReviewStatus } : a))
    );
  }, []);

  const handleReject = useCallback((id: string) => {
    setAtoms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'rejected' as ReviewStatus } : a))
    );
  }, []);

  const handleBatchAction = useCallback((ids: string[], action: 'approve' | 'reject') => {
    setAtoms((prev) =>
      prev.map((a) =>
        ids.includes(a.id) ? { ...a, status: action === 'approve' ? 'approved' : 'rejected' } : a
      )
    );
  }, []);

  const handleComplete = useCallback(() => {
    console.log('Review complete!');
  }, []);

  return (
    <div className="h-screen">
      <ReviewQueue
        atoms={atoms}
        onApprove={handleApprove}
        onReject={handleReject}
        onBatchAction={handleBatchAction}
        onComplete={handleComplete}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <ReviewQueueDemo initialAtoms={generateAtoms(12)} />,
};

export const FewAtoms: Story = {
  render: () => <ReviewQueueDemo initialAtoms={generateAtoms(3)} />,
  parameters: {
    docs: {
      description: {
        story: 'A queue with just a few atoms to review.',
      },
    },
  },
};

export const ManyAtoms: Story = {
  render: () => <ReviewQueueDemo initialAtoms={generateAtoms(50)} />,
  parameters: {
    docs: {
      description: {
        story: 'A large queue demonstrating scrolling and batch operations.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    atoms: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when there are no atoms to review.',
      },
    },
  },
};

export const AllReviewed: Story = {
  render: () => {
    const atoms = generateAtoms(5).map((a, i) => ({
      ...a,
      status: (i % 2 === 0 ? 'approved' : 'rejected') as ReviewStatus,
    }));
    return (
      <div className="h-screen">
        <ReviewQueue atoms={atoms} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Completion state when all atoms have been reviewed.',
      },
    },
  },
};

export const PartiallyReviewed: Story = {
  render: () => {
    const atoms = generateAtoms(10).map((a, i) => ({
      ...a,
      status: i < 4 ? (['approved', 'rejected'][i % 2] as ReviewStatus) : 'pending',
    }));
    return <ReviewQueueDemo initialAtoms={atoms} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Queue with some atoms already reviewed, showing progress.',
      },
    },
  },
};

export const KeyboardNavigation: Story = {
  render: () => <ReviewQueueDemo initialAtoms={generateAtoms(8)} />,
  parameters: {
    docs: {
      description: {
        story: `
## Try These Keyboard Shortcuts

1. Press **j** or **ArrowDown** to move to the next atom
2. Press **k** or **ArrowUp** to move to the previous atom
3. Press **a** to approve the current atom
4. Press **r** to reject the current atom
5. Press **Space** to toggle selection
6. Press **?** to see all shortcuts

The current atom is highlighted and the context panel shows details.
        `,
      },
    },
  },
};
