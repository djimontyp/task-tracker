import type { Meta, StoryObj } from '@storybook/react';
import { MessageSquare, Mail, Slack } from 'lucide-react';
import SourceCard from './SourceCard';

const meta: Meta<typeof SourceCard> = {
  title: 'Pages/SettingsPage/SourceCard',
  component: SourceCard,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['active', 'inactive', 'not-configured', 'error'],
    },
    enabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SourceCard>;

// ═══════════════════════════════════════════════════════════════
// BASIC STATES
// ═══════════════════════════════════════════════════════════════

export const Active: Story = {
  args: {
    icon: MessageSquare,
    name: 'Telegram',
    description: 'Bot integration & groups management',
    status: 'active',
    statusLabel: 'Connected • 3 groups',
    enabled: true,
    onToggle: () => console.log('Toggle clicked'),
    onSettings: () => console.log('Settings clicked'),
  },
};

export const Inactive: Story = {
  args: {
    icon: Mail,
    name: 'Email',
    description: 'IMAP/SMTP integration',
    status: 'inactive',
    statusLabel: 'Inactive',
    enabled: false,
    onToggle: () => console.log('Toggle clicked'),
    onSettings: () => console.log('Settings clicked'),
  },
};

export const NotConfigured: Story = {
  args: {
    icon: Slack,
    name: 'Slack',
    description: 'Workspace integration',
    status: 'not-configured',
    statusLabel: 'Setup needed',
    enabled: false,
    onToggle: () => console.log('Toggle clicked'),
    onSettings: () => console.log('Settings clicked'),
  },
};

export const Error: Story = {
  args: {
    icon: MessageSquare,
    name: 'Telegram',
    description: 'Bot integration',
    status: 'error',
    statusLabel: 'Connection error',
    enabled: false,
    onToggle: () => console.log('Toggle clicked'),
    onSettings: () => console.log('Settings clicked'),
  },
};

// ═══════════════════════════════════════════════════════════════
// VARIATIONS
// ═══════════════════════════════════════════════════════════════

export const LongDescription: Story = {
  args: {
    icon: MessageSquare,
    name: 'Telegram',
    description: 'This is a very long description that demonstrates how the component handles text wrapping without truncation. Bot integration with multiple groups, channels, and advanced management features.',
    status: 'active',
    statusLabel: 'Connected • 5 groups',
    enabled: true,
    onToggle: () => console.log('Toggle clicked'),
    onSettings: () => console.log('Settings clicked'),
  },
};

export const LongName: Story = {
  args: {
    icon: MessageSquare,
    name: 'Telegram Integration with Very Long Name',
    description: 'Bot integration',
    status: 'active',
    enabled: true,
    onToggle: () => console.log('Toggle clicked'),
    onSettings: () => console.log('Settings clicked'),
  },
};

export const MinimalLabels: Story = {
  args: {
    icon: MessageSquare,
    name: 'Telegram',
    description: 'Bot',
    status: 'active',
    enabled: true,
    onToggle: () => console.log('Toggle clicked'),
    onSettings: () => console.log('Settings clicked'),
  },
};

// ═══════════════════════════════════════════════════════════════
// GRID LAYOUT
// ═══════════════════════════════════════════════════════════════

export const GridLayout: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
      <SourceCard
        icon={MessageSquare}
        name="Telegram"
        description="3 groups connected"
        status="active"
        statusLabel="Connected • 3 groups"
        enabled={true}
        onToggle={() => {}}
        onSettings={() => {}}
      />
      <SourceCard
        icon={Slack}
        name="Slack"
        description="Setup needed"
        status="not-configured"
        enabled={false}
        onToggle={() => {}}
        onSettings={() => {}}
      />
      <SourceCard
        icon={Mail}
        name="Email"
        description="IMAP integration"
        status="inactive"
        enabled={false}
        onToggle={() => {}}
        onSettings={() => {}}
      />
    </div>
  ),
};

// ═══════════════════════════════════════════════════════════════
// INTERACTIVE DEMO
// ═══════════════════════════════════════════════════════════════

export const Interactive: Story = {
  render: () => {
    const [enabled, setEnabled] = React.useState(true);
    const [status, setStatus] = React.useState<'active' | 'inactive' | 'not-configured' | 'error'>('active');

    return (
      <div className="max-w-md">
        <SourceCard
          icon={MessageSquare}
          name="Telegram"
          description="Bot integration & groups management"
          status={status}
          statusLabel={enabled ? 'Connected • 3 groups' : 'Inactive'}
          enabled={enabled}
          onToggle={() => {
            setEnabled(!enabled);
            setStatus(enabled ? 'inactive' : 'active');
          }}
          onSettings={() => alert('Settings clicked')}
        />
      </div>
    );
  },
};

// React import for Interactive story
import * as React from 'react';
