import type { Meta, StoryObj } from '@storybook/react';
import { MessageSquare, Bot, Sparkles } from 'lucide-react';
import { SettingsCard, AddSettingsCard } from './SettingsCard';

const meta: Meta<typeof SettingsCard> = {
  title: 'Pages/SettingsPage/SettingsCard',
  component: SettingsCard,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['connected', 'active', 'pending', 'error', 'disabled', 'loading'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SettingsCard>;

// ═══════════════════════════════════════════════════════════════
// BASIC STATES
// ═══════════════════════════════════════════════════════════════

export const Connected: Story = {
  args: {
    icon: MessageSquare,
    title: 'Telegram',
    description: 'Bot integration & groups management',
    status: 'connected',
    statusLabel: 'Connected • 3 groups',
    onClick: () => console.log('Card clicked'),
  },
};

export const Active: Story = {
  args: {
    icon: Bot,
    title: 'OpenAI Provider',
    description: 'GPT-4 model access',
    status: 'active',
    onClick: () => console.log('Card clicked'),
  },
};

export const Pending: Story = {
  args: {
    icon: Sparkles,
    title: 'Ollama',
    description: 'Local LLM provider',
    status: 'pending',
    statusLabel: 'Setup needed',
    onClick: () => console.log('Card clicked'),
  },
};

export const Error: Story = {
  args: {
    icon: Bot,
    title: 'Anthropic Provider',
    description: 'Claude model access',
    status: 'error',
    statusLabel: 'Connection error',
    onClick: () => console.log('Card clicked'),
  },
};

export const Disabled: Story = {
  args: {
    icon: MessageSquare,
    title: 'Slack',
    description: 'Coming soon',
    status: 'disabled',
    statusLabel: 'Soon',
  },
};

export const Loading: Story = {
  args: {
    icon: Bot,
    title: 'Validating Provider',
    description: 'Checking connection...',
    status: 'loading',
    isLoading: true,
  },
};

// ═══════════════════════════════════════════════════════════════
// WITH FOOTER
// ═══════════════════════════════════════════════════════════════

export const WithToggleFooter: Story = {
  args: {
    icon: MessageSquare,
    title: 'Telegram',
    description: 'Bot integration',
    status: 'connected',
    onClick: () => console.log('Settings clicked'),
    footer: {
      type: 'toggle',
      label: 'Enable',
      checked: true,
      onClick: () => console.log('Toggle clicked'),
    },
  },
};

export const WithButtonFooter: Story = {
  args: {
    icon: Bot,
    title: 'Provider',
    description: 'LLM integration',
    status: 'active',
    footer: {
      type: 'button',
      label: 'Configure',
      onClick: () => console.log('Button clicked'),
    },
  },
};

// ═══════════════════════════════════════════════════════════════
// ADD CARD
// ═══════════════════════════════════════════════════════════════

export const AddCard: Story = {
  render: () => (
    <AddSettingsCard
      label="Add Provider"
      onClick={() => console.log('Add clicked')}
    />
  ),
};

// ═══════════════════════════════════════════════════════════════
// VARIATIONS
// ═══════════════════════════════════════════════════════════════

export const LongTitle: Story = {
  args: {
    icon: MessageSquare,
    title: 'Very Long Provider Name That Might Need Truncation',
    description: 'This is a very long description that demonstrates how the component handles overflow text in the description area',
    status: 'connected',
    onClick: () => console.log('Card clicked'),
  },
};

export const NoStatus: Story = {
  args: {
    icon: MessageSquare,
    title: 'Basic Card',
    description: 'Card without status badge',
    onClick: () => console.log('Card clicked'),
  },
};

// ═══════════════════════════════════════════════════════════════
// GRID LAYOUT
// ═══════════════════════════════════════════════════════════════

export const GridLayout: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
      <SettingsCard
        icon={MessageSquare}
        title="Telegram"
        description="3 groups connected"
        status="connected"
        onClick={() => {}}
      />
      <SettingsCard
        icon={Bot}
        title="OpenAI"
        description="GPT-4 access"
        status="active"
        onClick={() => {}}
      />
      <SettingsCard
        icon={Sparkles}
        title="Ollama"
        description="Setup needed"
        status="pending"
        onClick={() => {}}
      />
      <AddSettingsCard label="Add Provider" onClick={() => {}} />
    </div>
  ),
};
