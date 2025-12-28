import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SignalCard, NoiseCard, MessageCard, type MessageData } from './SignalNoiseCard';

// Sample message data
const signalMessage: MessageData = {
  id: 'msg-1',
  content:
    'We need to finalize the API schema before the sprint ends. The frontend team is blocked on this. Can we schedule a meeting tomorrow to discuss the remaining endpoints?',
  author: 'Sarah Chen',
  timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  score: 0.85,
  classification: 'signal',
  topics: ['API', 'Sprint Planning', 'Frontend'],
  isReviewed: false,
};

const noiseMessage: MessageData = {
  id: 'msg-2',
  content:
    'Hey everyone, just wanted to say good morning! Hope you all have a great day ahead. The weather looks nice today.',
  author: 'Mike Johnson',
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  score: 0.18,
  classification: 'noise',
  isReviewed: false,
};

const longSignalMessage: MessageData = {
  id: 'msg-3',
  content: `Critical update on the production deployment:

1. Database migration completed successfully
2. All API endpoints are responding within acceptable latency
3. Frontend assets have been deployed to CDN
4. Load balancer health checks are passing

However, we noticed some increased memory usage on the worker nodes. This might be related to the new caching layer we introduced. We should monitor this closely over the next 24 hours.

Action items:
- Set up alerts for memory threshold
- Review caching configuration
- Prepare rollback plan if issues escalate

Please acknowledge receipt of this message.`,
  author: 'DevOps Team',
  timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  score: 0.95,
  classification: 'signal',
  topics: ['Deployment', 'Production', 'Infrastructure'],
  isReviewed: false,
};

const reviewedSignalMessage: MessageData = {
  ...signalMessage,
  id: 'msg-4',
  isReviewed: true,
};

const meta: Meta<typeof SignalCard> = {
  title: 'Features/Noise/MessageCards',
  component: SignalCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Message cards for signal/noise classification review.

**SignalCard**: For important messages
- Green left border and background tint
- Sparkles icon indicator
- Prominent approve/reject actions

**NoiseCard**: For filtered messages
- Muted border and reduced opacity
- VolumeX icon indicator
- Actions in dropdown menu

Both cards support:
- Selection for bulk actions
- Expand/collapse for long content
- Topic badges
- Review status indicator
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SignalCard>;

// Signal Card Stories
export const Signal: Story = {
  args: {
    message: signalMessage,
  },
  parameters: {
    docs: {
      description: {
        story: 'Signal card for important messages with high scores.',
      },
    },
  },
};

export const SignalWithActions: Story = {
  render: () => {
    return (
      <SignalCard
        message={signalMessage}
        onApprove={(id) => console.log('Approved:', id)}
        onReject={(id) => console.log('Rejected:', id)}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Signal card with approve/reject action buttons.',
      },
    },
  },
};

export const SignalLongContent: Story = {
  render: () => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    return (
      <SignalCard
        message={longSignalMessage}
        expanded={expanded[longSignalMessage.id]}
        onToggleExpand={(id) =>
          setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
        }
        onApprove={(id) => console.log('Approved:', id)}
        onReject={(id) => console.log('Rejected:', id)}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Long message with expand/collapse functionality.',
      },
    },
  },
};

export const SignalSelected: Story = {
  args: {
    message: signalMessage,
    selected: true,
    onSelect: (id, selected) => console.log('Selection:', id, selected),
  },
  parameters: {
    docs: {
      description: {
        story: 'Signal card in selected state with ring highlight.',
      },
    },
  },
};

export const SignalReviewed: Story = {
  args: {
    message: reviewedSignalMessage,
  },
  parameters: {
    docs: {
      description: {
        story: 'Signal card with reviewed status badge.',
      },
    },
  },
};

// Noise Card Stories
export const Noise: Story = {
  render: () => <NoiseCard message={noiseMessage} />,
  parameters: {
    docs: {
      description: {
        story: 'Noise card for filtered messages with low scores.',
      },
    },
  },
};

export const NoiseWithActions: Story = {
  render: () => (
    <NoiseCard
      message={noiseMessage}
      onApprove={(id) => console.log('Marked as signal:', id)}
      onReject={(id) => console.log('Confirmed noise:', id)}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Noise card with dropdown menu actions.',
      },
    },
  },
};

export const NoiseSelected: Story = {
  render: () => (
    <NoiseCard
      message={noiseMessage}
      selected={true}
      onSelect={(id, selected) => console.log('Selection:', id, selected)}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Noise card in selected state.',
      },
    },
  },
};

// MessageCard (auto-select)
export const AutoSelect: Story = {
  render: () => (
    <div className="space-y-4">
      <MessageCard
        message={signalMessage}
        onApprove={(id) => console.log('Approved:', id)}
        onReject={(id) => console.log('Rejected:', id)}
      />
      <MessageCard
        message={noiseMessage}
        onApprove={(id) => console.log('Marked as signal:', id)}
        onReject={(id) => console.log('Confirmed noise:', id)}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'MessageCard auto-selects SignalCard or NoiseCard based on classification.',
      },
    },
  },
};

// Interactive example with selection
export const InteractiveSelection: Story = {
  render: () => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = (id: string, selected: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (selected) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    };

    const messages = [signalMessage, noiseMessage, longSignalMessage];

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Selected: {selectedIds.size} / {messages.length}
        </div>
        {messages.map((msg) => (
          <MessageCard
            key={msg.id}
            message={msg}
            selected={selectedIds.has(msg.id)}
            onSelect={toggleSelection}
            onApprove={(id) => console.log('Approved:', id)}
            onReject={(id) => console.log('Rejected:', id)}
          />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo with selectable message cards.',
      },
    },
  },
};

// Comparison view
export const Comparison: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-6 w-[600px]">
      <div>
        <h3 className="text-sm font-medium mb-3">Signal (Important)</h3>
        <SignalCard
          message={signalMessage}
          onApprove={(id) => console.log('Approved:', id)}
          onReject={(id) => console.log('Rejected:', id)}
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">Noise (Filtered)</h3>
        <NoiseCard
          message={noiseMessage}
          onApprove={(id) => console.log('Marked as signal:', id)}
          onReject={(id) => console.log('Confirmed noise:', id)}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of signal vs noise card styling.',
      },
    },
  },
};

// Message feed simulation
export const MessageFeed: Story = {
  render: () => {
    const messages: MessageData[] = [
      {
        id: '1',
        content: 'Sprint retrospective scheduled for Friday at 3 PM.',
        author: 'PM Team',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        score: 0.78,
        classification: 'signal',
        topics: ['Sprint', 'Meeting'],
      },
      {
        id: '2',
        content: 'Anyone want to grab lunch today?',
        author: 'John',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        score: 0.12,
        classification: 'noise',
      },
      {
        id: '3',
        content:
          'Critical: Production database reaching 85% capacity. Need to scale up.',
        author: 'Monitoring Bot',
        timestamp: new Date(Date.now() - 1000 * 60 * 2),
        score: 0.95,
        classification: 'signal',
        topics: ['Production', 'Alert'],
      },
      {
        id: '4',
        content: 'Thanks for the help yesterday!',
        author: 'Sarah',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        score: 0.15,
        classification: 'noise',
      },
    ];

    return (
      <div className="space-y-4 w-[550px]">
        <h3 className="text-sm font-medium">Message Review Queue</h3>
        {messages.map((msg) => (
          <MessageCard
            key={msg.id}
            message={msg}
            onApprove={(id) => console.log('Action on:', id)}
            onReject={(id) => console.log('Rejected:', id)}
          />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Realistic message feed with mixed signal/noise messages.',
      },
    },
  },
};
