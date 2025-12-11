import type { Meta, StoryObj } from '@storybook/react-vite';
import { useForm } from 'react-hook-form';
import { RuleActions } from './RuleActions';
import type { RuleFormData } from './ruleFormSchema';

/**
 * RuleActions - Actions section for automation rule form
 *
 * Used in:
 * - Automation rule creation wizard
 * - Rule editing forms
 */
const meta: Meta<typeof RuleActions> = {
  title: 'Features/Automation/RuleActions',
  component: RuleActions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**RuleActions** - Form section for rule action and status.

**Features:**
- Action selector (approve, reject, escalate, notify)
- Enabled/disabled toggle
- FormField pattern integration

**Usage:**
\`\`\`tsx
import { RuleActions } from '@/features/automation/components';

<RuleActions control={control} />
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RuleActions>;

// ═══════════════════════════════════════════════════════════════
// WRAPPER COMPONENT (provides react-hook-form context)
// ═══════════════════════════════════════════════════════════════

interface WrapperProps {
  defaultAction?: 'approve' | 'reject' | 'escalate' | 'notify';
  defaultEnabled?: boolean;
}

function Wrapper({ defaultAction = 'approve', defaultEnabled = true }: WrapperProps) {
  const { control } = useForm<RuleFormData>({
    defaultValues: {
      action: defaultAction,
      enabled: defaultEnabled,
    },
  });

  return (
    <div className="max-w-lg">
      <RuleActions control={control} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STORIES
// ═══════════════════════════════════════════════════════════════

export const Default: Story = {
  render: () => <Wrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Default action (approve) and enabled.',
      },
    },
  },
};

export const ActionApprove: Story = {
  render: () => <Wrapper defaultAction="approve" />,
  parameters: {
    docs: {
      description: {
        story: 'Rule configured to auto-approve.',
      },
    },
  },
};

export const ActionReject: Story = {
  render: () => <Wrapper defaultAction="reject" />,
  parameters: {
    docs: {
      description: {
        story: 'Rule configured to auto-reject.',
      },
    },
  },
};

export const ActionEscalate: Story = {
  render: () => <Wrapper defaultAction="escalate" />,
  parameters: {
    docs: {
      description: {
        story: 'Rule configured to escalate (requires manual review).',
      },
    },
  },
};

export const ActionNotify: Story = {
  render: () => <Wrapper defaultAction="notify" />,
  parameters: {
    docs: {
      description: {
        story: 'Rule configured to send notifications.',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => <Wrapper defaultAction="approve" defaultEnabled={false} />,
  parameters: {
    docs: {
      description: {
        story: 'Rule is disabled (toggle off).',
      },
    },
  },
};

export const EscalateDisabled: Story = {
  render: () => <Wrapper defaultAction="escalate" defaultEnabled={false} />,
  parameters: {
    docs: {
      description: {
        story: 'Escalate rule in disabled state.',
      },
    },
  },
};
