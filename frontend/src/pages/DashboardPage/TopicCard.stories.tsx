import type { Meta, StoryObj } from '@storybook/react-vite';
import { TopicCard } from './TopicCard';
import type { Topic } from '@/shared/types';
import { MemoryRouter } from 'react-router-dom';

/**
 * TopicCard component displays topic information with custom icons, colors,
 * message/atom counts, and last activity timestamps.
 *
 * ## Design System Rules
 * - Semantic colors: Uses topic.color for dynamic theming
 * - 4px grid spacing: `gap-4`, `px-6 py-4`, `mb-2`
 * - Touch targets: Card is ≥96px height, clickable area ≥44px
 * - Responsive: Truncation with line-clamp, responsive badge layouts
 * - Accessibility: ARIA labels, keyboard navigation (Enter/Space), focus-visible
 * - Interactive: Hover effects with shadow, scale transform, keyboard support
 */
const meta: Meta<typeof TopicCard> = {
  title: 'Features/TopicCard',
  component: TopicCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Topic card with dynamic color theming, Heroicon support, and keyboard navigation. Uses color-mix() for subtle gradients.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TopicCard>;

const baseTopic: Topic = {
  id: '1',
  name: 'Frontend Development',
  description: 'React, TypeScript, and modern web development discussions',
  icon: 'CodeBracketIcon',
  color: 'hsl(210, 100%, 50%)', // Blue
  message_count: 42,
  atoms_count: 15,
  last_message_at: '2025-12-04T14:30:00Z',
  created_at: '2025-11-01T10:00:00Z',
  updated_at: '2025-12-04T14:30:00Z',
};

export const Default: Story = {
  args: {
    topic: baseTopic,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default topic card with icon, description, message/atom counts, and last activity',
      },
    },
  },
};

export const WithoutDescription: Story = {
  args: {
    topic: {
      ...baseTopic,
      description: undefined,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Topic card without description (optional field)',
      },
    },
  },
};

export const NoActivity: Story = {
  args: {
    topic: {
      ...baseTopic,
      message_count: 0,
      atoms_count: 0,
      last_message_at: undefined,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Topic with no messages or atoms yet',
      },
    },
  },
};

export const HighActivity: Story = {
  args: {
    topic: {
      ...baseTopic,
      name: 'Backend Architecture',
      description: 'Database design, API patterns, microservices, and DevOps practices',
      icon: 'ServerIcon',
      color: 'hsl(150, 70%, 45%)', // Green
      message_count: 247,
      atoms_count: 89,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Topic with high activity (247 messages, 89 atoms)',
      },
    },
  },
};

export const RecentActivity: Story = {
  args: {
    topic: {
      ...baseTopic,
      last_message_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Topic with recent activity (5 minutes ago)',
      },
    },
  },
};

export const LongName: Story = {
  args: {
    topic: {
      ...baseTopic,
      name: 'Comprehensive Guide to Enterprise-Level Microservices Architecture and Design Patterns',
      description:
        'This is a very long description that demonstrates how the component handles text overflow with line-clamp-2. It should truncate gracefully and show ellipsis after two lines of content.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Topic with long name demonstrating truncate behavior',
      },
    },
  },
};

export const CustomColors: Story = {
  render: () => (
    <div className="space-y-4">
      <TopicCard
        topic={{
          ...baseTopic,
          id: '1',
          name: 'Security & Compliance',
          icon: 'ShieldCheckIcon',
          color: 'hsl(0, 80%, 50%)', // Red
        }}
      />
      <TopicCard
        topic={{
          ...baseTopic,
          id: '2',
          name: 'Product Design',
          icon: 'PaintBrushIcon',
          color: 'hsl(280, 70%, 60%)', // Purple
        }}
      />
      <TopicCard
        topic={{
          ...baseTopic,
          id: '3',
          name: 'Marketing Strategy',
          icon: 'MegaphoneIcon',
          color: 'hsl(45, 90%, 55%)', // Yellow
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple topic cards with different custom colors demonstrating color-mix() gradients',
      },
    },
  },
};

export const DifferentIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <TopicCard
        topic={{
          ...baseTopic,
          id: '1',
          name: 'Documentation',
          icon: 'DocumentTextIcon',
          color: 'hsl(200, 70%, 50%)',
        }}
      />
      <TopicCard
        topic={{
          ...baseTopic,
          id: '2',
          name: 'Bug Reports',
          icon: 'BugAntIcon',
          color: 'hsl(0, 80%, 50%)',
        }}
      />
      <TopicCard
        topic={{
          ...baseTopic,
          id: '3',
          name: 'Feature Requests',
          icon: 'LightBulbIcon',
          color: 'hsl(45, 90%, 55%)',
        }}
      />
      <TopicCard
        topic={{
          ...baseTopic,
          id: '4',
          name: 'Discussions',
          icon: 'ChatBubbleLeftRightIcon',
          color: 'hsl(280, 70%, 60%)',
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Topics with different Heroicons demonstrating icon system',
      },
    },
  },
};

export const MobileView: Story = {
  args: {
    topic: baseTopic,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Topic card on mobile viewport (375px) with responsive layout',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    topic: baseTopic,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive topic card: Click to navigate, hover for shadow/scale effects, keyboard navigation (Enter/Space)',
      },
    },
  },
};

export const WithHoverGlow: Story = {
  args: {
    topic: {
      ...baseTopic,
      name: 'Featured Topic',
      description: 'This is a featured topic with glow effect on hover',
      icon: 'StarIcon',
      color: 'hsl(38, 51%, 50%)', // Accent color
      message_count: 156,
      atoms_count: 42,
    },
  },
  render: (args) => (
    <div className="p-8 bg-background">
      <p className="text-sm text-muted-foreground mb-4">Hover to see glow effect</p>
      <div className="max-w-md transition-all duration-300 hover:shadow-glow-hover">
        <TopicCard {...args} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TopicCard with subtle glow effect on hover. Used for featured/trending topics that need visual emphasis.',
      },
    },
  },
};
