import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AgentTestDialog } from './AgentTestDialog'
import type { AgentConfig } from '@/features/agents/types'

// Create a fresh QueryClient for each story
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

/**
 * AgentTestDialog allows users to test an AI agent with a custom prompt.
 *
 * ## Features
 * - Input prompt with character count validation
 * - Example prompts for quick testing
 * - Streaming mode toggle for real-time output
 * - Collapsible full prompt view (system prompt + user input)
 * - Progress indicator with elapsed/remaining time
 * - JSON response viewer with syntax highlighting
 */
const meta: Meta<typeof AgentTestDialog> = {
  title: 'Features/Agents/AgentTestDialog',
  component: AgentTestDialog,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={createQueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls dialog visibility',
    },
    onClose: {
      action: 'close',
      description: 'Called when dialog is closed',
    },
    agent: {
      description: 'Agent configuration to test',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Dialog component for testing AI agents with custom prompts. Supports both streaming and non-streaming modes.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof AgentTestDialog>

// Mock data factory
const createMockAgent = (overrides?: Partial<AgentConfig>): AgentConfig => ({
  id: 'test-agent-id',
  name: 'Knowledge Extractor',
  description: 'Extracts knowledge from messages using AI analysis',
  model_name: 'qwen3:14b',
  system_prompt:
    'You are a knowledge extraction expert. Analyze the following message and extract key insights, tasks, and decisions. Return structured JSON.',
  temperature: 0.4,
  max_tokens: 4000,
  is_active: true,
  provider_id: 'provider-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Default state - dialog open with empty prompt
export const Default: Story = {
  args: {
    agent: createMockAgent(),
    open: true,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state with dialog open and empty prompt input.',
      },
    },
  },
}

// Dialog closed
export const Closed: Story = {
  args: {
    agent: createMockAgent(),
    open: false,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog in closed state (not visible).',
      },
    },
  },
}

// Without agent (null)
export const NoAgent: Story = {
  args: {
    agent: null,
    open: true,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog without agent (shows generic title, test button disabled).',
      },
    },
  },
}

// Different agent types
export const ClassificationAgent: Story = {
  args: {
    agent: createMockAgent({
      id: 'classifier-1',
      name: 'Message Classifier',
      description: 'Classifies messages as SIGNAL or NOISE',
      model_name: 'gpt-4-turbo',
      system_prompt:
        'You are a message classifier. Analyze the message and classify it as SIGNAL (important, actionable) or NOISE (spam, low-quality). Return JSON with classification and confidence score.',
      temperature: 0.2,
      max_tokens: 500,
    }),
    open: true,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Testing a classification agent with lower temperature.',
      },
    },
  },
}

export const AnalysisAgent: Story = {
  args: {
    agent: createMockAgent({
      id: 'analyzer-1',
      name: 'Deep Analyzer',
      description: 'Performs comprehensive message analysis',
      model_name: 'claude-3-opus',
      system_prompt:
        'Perform deep analysis of the message. Extract entities, identify relationships, determine sentiment, and suggest follow-up actions. Return detailed JSON report.',
      temperature: 0.7,
      max_tokens: 8000,
    }),
    open: true,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Testing an analysis agent with higher token limit.',
      },
    },
  },
}

// Long system prompt
export const LongSystemPrompt: Story = {
  args: {
    agent: createMockAgent({
      system_prompt: `You are an advanced AI assistant specialized in knowledge extraction from communication channels.

Your primary responsibilities:
1. Identify key information, decisions, and action items
2. Extract entities (people, projects, deadlines)
3. Categorize content by type (task, insight, question, decision)
4. Assess importance and urgency levels
5. Suggest follow-up actions

Output format:
- Return valid JSON with structured fields
- Include confidence scores for each extraction
- Provide reasoning for classifications

Context awareness:
- Consider previous conversation history
- Identify relationships between messages
- Track ongoing discussions and threads`,
    }),
    open: true,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Agent with a long system prompt. Click "View full prompt" to see the complete composed prompt.',
      },
    },
  },
}

// Inactive agent
export const InactiveAgent: Story = {
  args: {
    agent: createMockAgent({
      is_active: false,
      name: 'Disabled Agent',
    }),
    open: true,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Testing an inactive agent (still testable for validation purposes).',
      },
    },
  },
}

// Mobile view
export const MobileView: Story = {
  args: {
    agent: createMockAgent(),
    open: true,
    onClose: () => {},
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Dialog on mobile viewport (375px width). Dialog is responsive.',
      },
    },
  },
}

// Tablet view
export const TabletView: Story = {
  args: {
    agent: createMockAgent(),
    open: true,
    onClose: () => {},
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Dialog on tablet viewport (768px width).',
      },
    },
  },
}
