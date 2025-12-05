import type { Meta, StoryObj } from '@storybook/react-vite';
import { useForm, useFieldArray } from 'react-hook-form';
import { RuleConditions } from './RuleConditions';
import type { RuleFormData } from './ruleFormSchema';

/**
 * RuleConditions - Conditions section for automation rule form
 *
 * Used in:
 * - Automation rule creation wizard
 * - Rule editing forms
 */
const meta: Meta<typeof RuleConditions> = {
  title: 'Automation/RuleConditions',
  component: RuleConditions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**RuleConditions** - Dynamic conditions builder for automation rules.

**Features:**
- Add/remove conditions dynamically
- Logic operator selection (AND/OR)
- Empty state for no conditions
- Field array management (react-hook-form)

**Usage:**
\`\`\`tsx
import { RuleConditions } from '@/features/automation/components';

<RuleConditions
  control={control}
  errors={errors}
  fields={fields}
  onAddCondition={append}
  onRemoveCondition={remove}
/>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RuleConditions>;

// ═══════════════════════════════════════════════════════════════
// WRAPPER COMPONENT (provides react-hook-form context)
// ═══════════════════════════════════════════════════════════════

interface WrapperProps {
  initialConditions?: Array<{
    field: string;
    operator: 'gte' | 'lte' | 'eq' | 'ne' | 'contains' | 'starts_with';
    value: string | number;
  }>;
  initialLogicOperator?: 'AND' | 'OR';
}

function Wrapper({
  initialConditions = [],
  initialLogicOperator = 'AND',
}: WrapperProps) {
  const {
    control,
    formState: { errors },
  } = useForm<RuleFormData>({
    defaultValues: {
      conditions: initialConditions,
      logic_operator: initialLogicOperator,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'conditions',
  });

  const handleAddCondition = () => {
    append({
      field: 'importance_score',
      operator: 'gte',
      value: '0.8',
    });
  };

  return (
    <div className="max-w-2xl">
      <RuleConditions
        control={control}
        errors={errors}
        fields={fields}
        onAddCondition={handleAddCondition}
        onRemoveCondition={remove}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STORIES
// ═══════════════════════════════════════════════════════════════

export const Empty: Story = {
  render: () => <Wrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Empty state - no conditions added yet.',
      },
    },
  },
};

export const SingleCondition: Story = {
  render: () => (
    <Wrapper
      initialConditions={[
        {
          field: 'importance_score',
          operator: 'gte',
          value: '0.8',
        },
      ]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Form with single condition (no logic operator).',
      },
    },
  },
};

export const MultipleConditionsAnd: Story = {
  render: () => (
    <Wrapper
      initialConditions={[
        {
          field: 'importance_score',
          operator: 'gte',
          value: '0.8',
        },
        {
          field: 'source',
          operator: 'eq',
          value: 'telegram',
        },
        {
          field: 'topic',
          operator: 'contains',
          value: 'urgent',
        },
      ]}
      initialLogicOperator="AND"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple conditions with AND logic (all must match).',
      },
    },
  },
};

export const MultipleConditionsOr: Story = {
  render: () => (
    <Wrapper
      initialConditions={[
        {
          field: 'importance_score',
          operator: 'gte',
          value: '0.9',
        },
        {
          field: 'source',
          operator: 'eq',
          value: 'slack',
        },
      ]}
      initialLogicOperator="OR"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple conditions with OR logic (any can match).',
      },
    },
  },
};

export const ComplexRule: Story = {
  render: () => (
    <Wrapper
      initialConditions={[
        {
          field: 'importance_score',
          operator: 'gte',
          value: '0.7',
        },
        {
          field: 'topic',
          operator: 'contains',
          value: 'bug',
        },
        {
          field: 'source',
          operator: 'eq',
          value: 'telegram',
        },
        {
          field: 'created_at',
          operator: 'gte',
          value: '2024-01-01',
        },
      ]}
      initialLogicOperator="AND"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complex rule with 4 conditions.',
      },
    },
  },
};
