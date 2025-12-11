import type { Meta, StoryObj } from '@storybook/react-vite';
import AgentCard from './AgentCard';
import type { AgentConfig } from '@/features/agents/types';

/**
 * AgentCard component displays AI agent configuration with actions.
 *
 * ## Features
 * - Displays agent name, description, model, and parameters
 * - Shows active/inactive status badge
 * - Provides actions: Edit, Manage Tasks, Test, Delete
 * - Responsive card layout with hover shadow effect
 */
const meta: Meta<typeof AgentCard> = {
  title: 'Features/Agents/AgentCard',
  component: AgentCard,
  tags: ['autodocs'],
  argTypes: {
    onEdit: {
      action: 'edit',
      description: 'Called when edit button is clicked',
    },
    onDelete: {
      action: 'delete',
      description: 'Called when delete button is clicked',
    },
    onManageTasks: {
      action: 'manageTasks',
      description: 'Called when manage tasks button is clicked',
    },
    onTest: {
      action: 'test',
      description: 'Called when test button is clicked',
    },
    isDeleting: {
      control: 'boolean',
      description: 'Shows loading state on delete button',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'Card component for displaying AI agent configuration with management actions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AgentCard>;

// Mock data factory
const createMockAgent = (overrides?: Partial<AgentConfig>): AgentConfig => ({
  id: '1',
  name: 'Knowledge Extractor',
  description: 'Extracts knowledge atoms from messages using advanced NLP',
  provider_id: 'provider-1',
  model_name: 'gpt-4',
  system_prompt: 'You are a knowledge extraction assistant. Analyze messages and extract key insights, tasks, and decisions.',
  temperature: 0.7,
  max_tokens: 2000,
  is_active: true,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  ...overrides,
});

// Basic states
export const Default: Story = {
  args: {
    agent: createMockAgent(),
  },
};

export const Active: Story = {
  args: {
    agent: createMockAgent({ is_active: true }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Agent with active status badge (green).',
      },
    },
  },
};

export const Inactive: Story = {
  args: {
    agent: createMockAgent({ is_active: false }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Agent with inactive status badge (gray).',
      },
    },
  },
};

export const WithLongDescription: Story = {
  args: {
    agent: createMockAgent({
      description: 'This is a highly sophisticated AI agent designed to extract knowledge atoms from incoming messages using state-of-the-art natural language processing techniques. It analyzes conversation context, identifies key insights, and categorizes information into actionable tasks, important decisions, and valuable insights for the knowledge base.',
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Agent card with long description text.',
      },
    },
  },
};

export const WithoutDescription: Story = {
  args: {
    agent: createMockAgent({ description: undefined }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Agent card without description field.',
      },
    },
  },
};

export const WithMinimalParameters: Story = {
  args: {
    agent: createMockAgent({
      temperature: undefined,
      max_tokens: undefined,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Agent without optional temperature and max_tokens parameters.',
      },
    },
  },
};

export const ClassificationAgent: Story = {
  args: {
    agent: createMockAgent({
      id: '2',
      name: 'Message Classifier',
      description: 'Classifies messages as SIGNAL or NOISE based on content quality',
      model_name: 'gpt-4-turbo',
      system_prompt: 'Classify incoming messages as SIGNAL (important) or NOISE (spam/low-quality).',
      temperature: 0.3,
      max_tokens: 500,
      is_active: true,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Agent configured for message classification tasks.',
      },
    },
  },
};

export const AnalysisAgent: Story = {
  args: {
    agent: createMockAgent({
      id: '3',
      name: 'Deep Analyzer',
      description: 'Performs comprehensive analysis of message context and relationships',
      model_name: 'claude-3-opus',
      system_prompt: 'Analyze message context, extract entities, and identify relationships between topics.',
      temperature: 0.8,
      max_tokens: 4000,
      is_active: true,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Agent configured for deep analysis with higher token limit.',
      },
    },
  },
};

export const Deleting: Story = {
  args: {
    agent: createMockAgent(),
    isDeleting: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Agent card in deleting state (delete button disabled).',
      },
    },
  },
};

// Multiple cards showcase
export const MultipleAgents: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <AgentCard
        agent={createMockAgent({
          id: '1',
          name: 'Knowledge Extractor',
          description: 'Extracts knowledge atoms',
          is_active: true,
        })}
        onEdit={() => {}}
        onDelete={() => {}}
        onManageTasks={() => {}}
        onTest={() => {}}
      />
      <AgentCard
        agent={createMockAgent({
          id: '2',
          name: 'Classifier',
          description: 'Classifies messages',
          model_name: 'gpt-4-turbo',
          is_active: true,
        })}
        onEdit={() => {}}
        onDelete={() => {}}
        onManageTasks={() => {}}
        onTest={() => {}}
      />
      <AgentCard
        agent={createMockAgent({
          id: '3',
          name: 'Inactive Agent',
          description: 'Currently disabled',
          is_active: false,
        })}
        onEdit={() => {}}
        onDelete={() => {}}
        onManageTasks={() => {}}
        onTest={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple agent cards in responsive grid layout.',
      },
    },
  },
};

// Mobile view
export const MobileView: Story = {
  args: {
    agent: createMockAgent(),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Agent card on mobile viewport (375px width).',
      },
    },
  },
};
