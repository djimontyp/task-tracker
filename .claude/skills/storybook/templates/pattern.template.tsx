/**
 * Template for shared/patterns/ component stories (Tier 2)
 *
 * Minimum: 5-8 stories covering all statuses, compositions, use cases
 *
 * Replace:
 * - __COMPONENT_NAME__ → actual component name (e.g., CardWithStatus)
 * - __COMPONENT_FILE__ → file name (e.g., CardWithStatus)
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Zap, Server, Cloud, Cpu } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { __COMPONENT_NAME__ } from './__COMPONENT_FILE__';

/**
 * Pattern description - when and why to use this pattern.
 *
 * Use this pattern for:
 * - Use case 1
 * - Use case 2
 * - Use case 3
 */
const meta: Meta<typeof __COMPONENT_NAME__> = {
  title: 'Design System/Patterns/__COMPONENT_NAME__',
  component: __COMPONENT_NAME__,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['connected', 'validating', 'pending', 'error'],
      description: 'Current status of the entity',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'Brief description for autodocs.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof __COMPONENT_NAME__>;

// ═══════════════════════════════════════════════════════════════
// STATUS STORIES (REQUIRED - all 4 states)
// ═══════════════════════════════════════════════════════════════

export const Connected: Story = {
  args: {
    icon: Zap,
    title: 'Entity Name',
    description: 'Description of the connected entity',
    status: 'connected',
    statusLabel: 'Active',
  },
};

export const Validating: Story = {
  args: {
    icon: Cloud,
    title: 'Entity Name',
    description: 'Currently validating connection',
    status: 'validating',
    statusLabel: 'Checking...',
  },
};

export const Pending: Story = {
  args: {
    icon: Server,
    title: 'Entity Name',
    description: 'Awaiting setup or configuration',
    status: 'pending',
    statusLabel: 'Setup needed',
  },
};

export const Error: Story = {
  args: {
    icon: Cpu,
    title: 'Entity Name',
    description: 'Connection or validation failed',
    status: 'error',
    statusLabel: 'Connection failed',
  },
};

// ═══════════════════════════════════════════════════════════════
// COMPOSITION STORIES (REQUIRED)
// ═══════════════════════════════════════════════════════════════

export const WithFooter: Story = {
  args: {
    icon: Zap,
    title: 'With Footer Actions',
    description: 'Card with action buttons in footer',
    status: 'connected',
    footer: (
      <div className="flex items-center justify-between w-full">
        <Button variant="ghost" size="sm">Settings</Button>
        <Button size="sm">Configure</Button>
      </div>
    ),
  },
};

export const WithContent: Story = {
  args: {
    icon: Cloud,
    title: 'With Custom Content',
    description: 'Card with additional content section',
    status: 'connected',
    children: (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Metric 1</span>
          <span className="font-medium">Value 1</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Metric 2</span>
          <span className="font-medium">Value 2</span>
        </div>
      </div>
    ),
  },
};

export const Interactive: Story = {
  args: {
    icon: Server,
    title: 'Clickable Card',
    description: 'Click to see action',
    status: 'connected',
    interactive: true,
    onClick: () => alert('Card clicked!'),
  },
};

// ═══════════════════════════════════════════════════════════════
// LAYOUT STORIES (REQUIRED)
// ═══════════════════════════════════════════════════════════════

export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <__COMPONENT_NAME__
        icon={Zap}
        title="Entity 1"
        description="Description"
        status="connected"
      />
      <__COMPONENT_NAME__
        icon={Cloud}
        title="Entity 2"
        description="Description"
        status="validating"
      />
      <__COMPONENT_NAME__
        icon={Server}
        title="Entity 3"
        description="Description"
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

// ═══════════════════════════════════════════════════════════════
// USE CASE STORIES (RECOMMENDED)
// ═══════════════════════════════════════════════════════════════

// export const ProviderCard: Story = {
//   args: {
//     icon: Zap,
//     title: 'OpenAI',
//     description: 'GPT-4 model access',
//     status: 'connected',
//   },
//   parameters: {
//     docs: {
//       description: {
//         story: 'Example: LLM Provider card',
//       },
//     },
//   },
// };

// export const SourceCard: Story = {
//   args: {
//     icon: MessageSquare,
//     title: 'Telegram',
//     description: 'Message ingestion source',
//     status: 'connected',
//   },
//   parameters: {
//     docs: {
//       description: {
//         story: 'Example: Data source integration card',
//       },
//     },
//   },
// };
