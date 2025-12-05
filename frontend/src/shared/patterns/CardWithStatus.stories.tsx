import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Zap,
  Server,
  Cloud,
  Cpu,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { CardWithStatus, StatusBadge, StatusDot } from './CardWithStatus';

/**
 * CardWithStatus pattern for displaying entities with their current state.
 *
 * Use this pattern for:
 * - Provider cards (LLM providers, APIs)
 * - Source cards (Telegram, Slack integrations)
 * - Agent cards (AI agents)
 * - Service status displays
 */
const meta: Meta<typeof CardWithStatus> = {
  title: 'Design System/Patterns/CardWithStatus',
  component: CardWithStatus,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['connected', 'validating', 'pending', 'error'],
    },
    interactive: {
      control: 'boolean',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'Card with icon, title, and status badge. A common pattern for entity displays.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CardWithStatus>;

/**
 * Connected provider card
 */
export const Connected: Story = {
  args: {
    icon: Zap,
    title: 'OpenAI Provider',
    description: 'GPT-4 and GPT-3.5 model access for AI analysis',
    status: 'connected',
    statusLabel: 'Active',
  },
};

/**
 * Validating status (in progress)
 */
export const Validating: Story = {
  args: {
    icon: Cloud,
    title: 'Ollama Local',
    description: 'Local LLM server for privacy-focused analysis',
    status: 'validating',
    statusLabel: 'Checking...',
  },
};

/**
 * Pending setup
 */
export const Pending: Story = {
  args: {
    icon: Server,
    title: 'Anthropic Claude',
    description: 'Claude API for advanced reasoning tasks',
    status: 'pending',
    statusLabel: 'Setup needed',
  },
};

/**
 * Error state
 */
export const Error: Story = {
  args: {
    icon: Cpu,
    title: 'Custom API',
    description: 'Connection to external ML service failed',
    status: 'error',
    statusLabel: 'Connection failed',
  },
};

/**
 * Card with footer actions
 */
export const WithFooter: Story = {
  args: {
    icon: Zap,
    title: 'OpenAI Provider',
    description: 'GPT-4 and GPT-3.5 model access',
    status: 'connected',
    footer: (
      <div className="flex items-center justify-between w-full">
        <Button variant="ghost" size="sm">Settings</Button>
        <Switch defaultChecked aria-label="Toggle provider" />
      </div>
    ),
  },
};

/**
 * Interactive card (clickable)
 */
export const Interactive: Story = {
  args: {
    icon: Server,
    title: 'Telegram Source',
    description: 'Click to configure Telegram integration',
    status: 'connected',
    interactive: true,
    onClick: () => alert('Card clicked!'),
  },
};

/**
 * Card with custom content
 */
export const WithContent: Story = {
  args: {
    icon: Cloud,
    title: 'Ollama Models',
    description: 'Local LLM server',
    status: 'connected',
    children: (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Models loaded</span>
          <span className="font-medium">3</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Memory usage</span>
          <span className="font-medium">4.2 GB</span>
        </div>
      </div>
    ),
  },
};

/**
 * StatusBadge standalone component
 */
export const BadgeStandalone: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <StatusBadge status="connected" />
      <StatusBadge status="validating" />
      <StatusBadge status="pending" />
      <StatusBadge status="error" />
      <StatusBadge status="connected" label="Online" />
      <StatusBadge status="error" label="Offline" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'StatusBadge can be used standalone when you need just the badge.',
      },
    },
  },
};

/**
 * StatusDot minimal indicator
 */
export const DotIndicator: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <StatusDot status="connected" />
        <span className="text-sm">Connected</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot status="validating" pulse />
        <span className="text-sm">Validating (pulse)</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot status="pending" />
        <span className="text-sm">Pending</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot status="error" />
        <span className="text-sm">Error</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'StatusDot for minimal status indicators. Use `pulse` for active states.',
      },
    },
  },
};

/**
 * Grid of cards
 */
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CardWithStatus
        icon={Zap}
        title="OpenAI"
        description="GPT-4 access"
        status="connected"
      />
      <CardWithStatus
        icon={Cloud}
        title="Ollama"
        description="Local models"
        status="validating"
      />
      <CardWithStatus
        icon={Server}
        title="Anthropic"
        description="Claude API"
        status="pending"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Cards in a responsive grid layout.',
      },
    },
  },
};
