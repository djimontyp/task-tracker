import type { Meta, StoryObj } from '@storybook/react-vite';
import { MessageCard } from './MessageCard';
import type { Message } from '@/shared/types';

/**
 * MessageCard component displays message information with analysis status,
 * importance scores, noise classification, and topic badges.
 *
 * ## Design System Rules
 * - Semantic colors: status badges use semantic tokens (success, warning, error)
 * - 4px grid spacing: `p-4`, `gap-2`, `gap-4`, `space-y-4`
 * - Touch targets: Checkbox ≥44px clickable area
 * - Responsive: Mobile-first with line-clamp-3, truncate, break-words
 * - Accessibility: Checkbox with aria-label, avatar alt text
 * - Interactive: Hover effects, selection state, click handlers
 */
const meta: Meta<typeof MessageCard> = {
  title: 'Features/Messages/MessageCard',
  component: MessageCard,
  tags: ['autodocs'],
  argTypes: {
    onSelect: { action: 'selected' },
    onClick: { action: 'clicked' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Message card with analysis status, importance score, noise classification, and topic badge. Supports selection and click actions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MessageCard>;

const baseMessage: Message = {
  id: 1,
  external_message_id: 'msg-001',
  author_id: 1,
  author_name: 'John Doe',
  content: 'We need to fix the database connection pooling issue. Connections are timing out under load.',
  sent_at: '2025-12-04T14:30:00Z',
  source_name: 'Telegram',
  analyzed: true,
  importance_score: 0.85,
  noise_classification: 'signal',
  topic_name: 'Backend Issues',
  avatar_url: undefined,
};

export const Default: Story = {
  args: {
    message: baseMessage,
    isSelected: false,
    onSelect: () => {},
    onClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Default message card with analysis status, importance score, and topic badge',
      },
    },
  },
};

export const Selected: Story = {
  args: {
    message: baseMessage,
    isSelected: true,
    onSelect: () => {},
    onClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Selected message card with primary border and accent background',
      },
    },
  },
};

export const Unanalyzed: Story = {
  args: {
    message: {
      ...baseMessage,
      analyzed: false,
      importance_score: undefined,
      noise_classification: undefined,
    },
    isSelected: false,
    onSelect: () => {},
    onClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Unanalyzed message showing "Pending" status badge',
      },
    },
  },
};

export const HighImportance: Story = {
  args: {
    message: {
      ...baseMessage,
      importance_score: 0.92,
      content: 'URGENT: Production database is down! All API requests are failing with 500 errors.',
      noise_classification: 'signal',
    },
    isSelected: false,
    onSelect: () => {},
    onClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'High importance message (92% score) with high_quality classification',
      },
    },
  },
};

export const LowImportance: Story = {
  args: {
    message: {
      ...baseMessage,
      importance_score: 0.23,
      content: 'Thanks for the update! 👍',
      noise_classification: 'weak_signal',
    },
    isSelected: false,
    onSelect: () => {},
    onClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Low importance message (23% score) with low_quality classification',
      },
    },
  },
};

export const Noise: Story = {
  args: {
    message: {
      ...baseMessage,
      importance_score: 0.12,
      content: 'lol haha 😂😂😂',
      noise_classification: 'noise',
    },
    isSelected: false,
    onSelect: () => {},
    onClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Noise message with low importance score and noise classification',
      },
    },
  },
};

export const Spam: Story = {
  args: {
    message: {
      ...baseMessage,
      importance_score: 0.05,
      content: '🎉 WIN FREE CRYPTO! Click here: bit.ly/scam123 🚀💰',
      noise_classification: 'noise',
    },
    isSelected: false,
    onSelect: () => {},
    onClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Spam message with very low importance score',
      },
    },
  },
};

export const WithAvatar: Story = {
  args: {
    message: {
      ...baseMessage,
      avatar_url: 'https://i.pravatar.cc/150?img=1',
    },
    isSelected: false,
    onSelect: () => {},
    onClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Message with author avatar image',
      },
    },
  },
};

export const WithoutAvatar: Story = {
  args: {
    message: {
      ...baseMessage,
      avatar_url: undefined,
    },
    isSelected: false,
    onSelect: () => {},
    onClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Message without avatar showing fallback UserIcon',
      },
    },
  },
};

export const EmptyContent: Story = {
  args: {
    message: {
      ...baseMessage,
      content: '',
    },
    isSelected: false,
    onSelect: () => {},
    onClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty message showing "(Empty message)" placeholder with EnvelopeIcon',
      },
    },
  },
};

export const LongContent: Story = {
  args: {
    message: {
      ...baseMessage,
      content:
        'This is a very long message that demonstrates how the component handles text overflow. The message content should be clamped to 3 lines using line-clamp-3 utility class. Any content beyond three lines will be hidden with an ellipsis. This ensures the card maintains a consistent height and doesn not break the layout when messages are very long. Users can click the card to see the full content in a modal or detail view.',
    },
    isSelected: false,
    onSelect: () => {},
    onClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Long message demonstrating line-clamp-3 truncation',
      },
    },
  },
};

export const NoTopic: Story = {
  args: {
    message: {
      ...baseMessage,
      topic_name: undefined,
    },
    isSelected: false,
    onSelect: () => {},
    onClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Message without assigned topic',
      },
    },
  },
};

export const MultipleMessages: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <MessageCard
        message={{
          ...baseMessage,
          id: 1,
          content: 'Database connection pool exhausted. Need to increase max_connections.',
          importance_score: 0.89,
          noise_classification: 'signal',
        }}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
      <MessageCard
        message={{
          ...baseMessage,
          id: 2,
          content: 'Code review: LGTM! ✅',
          importance_score: 0.45,
          noise_classification: 'signal',
        }}
        isSelected={true}
        onSelect={() => {}}
        onClick={() => {}}
      />
      <MessageCard
        message={{
          ...baseMessage,
          id: 3,
          content: 'Meeting at 3pm today',
          importance_score: 0.62,
          noise_classification: 'signal',
        }}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
      <MessageCard
        message={{
          ...baseMessage,
          id: 4,
          analyzed: false,
          importance_score: undefined,
          noise_classification: undefined,
          content: 'Just joined the chat!',
        }}
        isSelected={false}
        onSelect={() => {}}
        onClick={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple message cards in a feed layout showing different states',
      },
    },
  },
};

export const MobileView: Story = {
  args: {
    message: baseMessage,
    isSelected: false,
    onSelect: () => {},
    onClick: () => {},
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Message card on mobile viewport (375px) with responsive badge wrapping',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    message: baseMessage,
    isSelected: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive message card: Click to view details, checkbox to select, hover effects',
      },
    },
  },
};
