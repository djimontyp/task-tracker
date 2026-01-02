import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { Mail } from 'lucide-react';
import { TelegramIcon, SlackIcon } from '@/shared/icons';
import SourceCard from './SourceCard';

const meta: Meta<typeof SourceCard> = {
  title: 'Pages/SettingsPage/SourceCard',
  component: SourceCard,
  tags: ['autodocs'],
  argTypes: {
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

export const Enabled: Story = {
  args: {
    icon: TelegramIcon,
    name: 'Telegram',
    description: 'Bot integration & groups management',
    enabled: true,
    onToggle: () => console.log('Toggle clicked'),
    onSettings: () => console.log('Settings clicked'),
  },
};

export const Disabled: Story = {
  args: {
    icon: Mail,
    name: 'Email',
    description: 'IMAP/SMTP integration',
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
    icon: TelegramIcon,
    name: 'Telegram',
    description: 'This is a very long description that demonstrates how the component handles text wrapping without truncation. Bot integration with multiple groups, channels, and advanced management features.',
    enabled: true,
    onToggle: () => console.log('Toggle clicked'),
    onSettings: () => console.log('Settings clicked'),
  },
};

export const LongName: Story = {
  args: {
    icon: TelegramIcon,
    name: 'Telegram Integration with Very Long Name',
    description: 'Bot integration',
    enabled: true,
    onToggle: () => console.log('Toggle clicked'),
    onSettings: () => console.log('Settings clicked'),
  },
};

export const MinimalLabels: Story = {
  args: {
    icon: TelegramIcon,
    name: 'Telegram',
    description: 'Bot',
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
        icon={TelegramIcon}
        name="Telegram"
        description="Bot integration & groups management"
        enabled={true}
        onToggle={() => {}}
        onSettings={() => {}}
      />
      <SourceCard
        icon={SlackIcon}
        name="Slack"
        description="Workspace integration"
        enabled={false}
        onToggle={() => {}}
        onSettings={() => {}}
      />
      <SourceCard
        icon={Mail}
        name="Email"
        description="IMAP integration"
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

    return (
      <div className="max-w-md">
        <SourceCard
          icon={TelegramIcon}
          name="Telegram"
          description="Bot integration & groups management"
          enabled={enabled}
          onToggle={() => setEnabled(!enabled)}
          onSettings={() => alert('Settings clicked')}
        />
      </div>
    );
  },
};
