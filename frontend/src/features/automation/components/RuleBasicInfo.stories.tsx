import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useForm } from 'react-hook-form';
import { RuleBasicInfo } from './RuleBasicInfo';
import type { RuleFormData } from './ruleFormSchema';

/**
 * RuleBasicInfo - Basic information section for automation rule form
 *
 * Used in:
 * - Automation rule creation wizard
 * - Rule editing forms
 */
const meta: Meta<typeof RuleBasicInfo> = {
  title: 'Features/Automation/RuleBasicInfo',
  component: RuleBasicInfo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**RuleBasicInfo** - Form section for rule name and priority.

**Features:**
- Controlled form inputs (react-hook-form)
- Priority slider (0-100)
- Validation error display
- FormField pattern integration

**Usage:**
\`\`\`tsx
import { RuleBasicInfo } from '@/features/automation/components';

<RuleBasicInfo
  control={control}
  errors={errors}
  priority={priority}
  onPriorityChange={setPriority}
/>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RuleBasicInfo>;

// ═══════════════════════════════════════════════════════════════
// WRAPPER COMPONENT (provides react-hook-form context)
// ═══════════════════════════════════════════════════════════════

interface WrapperProps {
  defaultName?: string;
  defaultPriority?: number;
  showError?: boolean;
}

function Wrapper({ defaultName = '', defaultPriority = 50, showError = false }: WrapperProps) {
  const {
    control,
    formState: { errors },
  } = useForm<RuleFormData>({
    defaultValues: {
      name: defaultName,
      priority: defaultPriority,
    },
  });

  const [priority, setPriority] = React.useState(defaultPriority);

  // Simulate error
  const displayErrors = showError
    ? { name: { message: 'Rule name is required', type: 'required' } }
    : errors;

  return (
    <div className="max-w-lg">
      <RuleBasicInfo
        control={control}
        errors={displayErrors}
        priority={priority}
        onPriorityChange={setPriority}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STORIES
// ═══════════════════════════════════════════════════════════════

export const Default: Story = {
  render: () => <Wrapper />,
};

export const WithDefaultName: Story = {
  render: () => <Wrapper defaultName="High Confidence Auto-Approval" />,
  parameters: {
    docs: {
      description: {
        story: 'Form with pre-filled name.',
      },
    },
  },
};

export const LowPriority: Story = {
  render: () => <Wrapper defaultPriority={10} />,
  parameters: {
    docs: {
      description: {
        story: 'Form with low priority (10).',
      },
    },
  },
};

export const HighPriority: Story = {
  render: () => <Wrapper defaultPriority={90} />,
  parameters: {
    docs: {
      description: {
        story: 'Form with high priority (90).',
      },
    },
  },
};

export const WithError: Story = {
  render: () => <Wrapper showError />,
  parameters: {
    docs: {
      description: {
        story: 'Form showing validation error.',
      },
    },
  },
};

export const Complete: Story = {
  render: () => (
    <Wrapper defaultName="Critical Issues Auto-Escalation" defaultPriority={85} />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Fully filled form.',
      },
    },
  },
};
