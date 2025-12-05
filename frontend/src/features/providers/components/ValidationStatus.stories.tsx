import type { Meta, StoryObj } from '@storybook/react-vite';
import ValidationStatus from './ValidationStatus';
import { ValidationStatus as Status } from '@/features/providers/types';

const meta: Meta<typeof ValidationStatus> = {
  title: 'Features/Providers/ValidationStatus',
  component: ValidationStatus,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'LLM provider validation status badge with icon and text. Shows connection state: pending, validating (animated spinner), connected, or error. Uses semantic color tokens for WCAG AA compliance.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(Status),
      description: 'Validation status state',
    },
    error: {
      control: 'text',
      description: 'Error message shown in title attribute (optional)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ValidationStatus>;

/**
 * Pending state - provider not yet validated
 */
export const Pending: Story = {
  args: {
    status: Status.PENDING,
  },
};

/**
 * Validating state - checking provider connection (animated spinner)
 */
export const Validating: Story = {
  args: {
    status: Status.VALIDATING,
  },
  parameters: {
    docs: {
      description: {
        story: 'Animated spinner icon rotates while validation is in progress',
      },
    },
  },
};

/**
 * Connected state - provider successfully validated
 */
export const Connected: Story = {
  args: {
    status: Status.CONNECTED,
  },
};

/**
 * Error state - validation failed
 */
export const Error: Story = {
  args: {
    status: Status.ERROR,
  },
};

/**
 * Error state with error message tooltip
 */
export const ErrorWithMessage: Story = {
  args: {
    status: Status.ERROR,
    error: 'Connection refused: Unable to reach Ollama server at http://localhost:11434',
  },
  parameters: {
    docs: {
      description: {
        story: 'Hover over badge to see error details in browser tooltip (title attribute)',
      },
    },
  },
};

/**
 * All states comparison
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium w-24">Pending:</span>
        <ValidationStatus status={Status.PENDING} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium w-24">Validating:</span>
        <ValidationStatus status={Status.VALIDATING} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium w-24">Connected:</span>
        <ValidationStatus status={Status.CONNECTED} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium w-24">Error:</span>
        <ValidationStatus status={Status.ERROR} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium w-24">Error + msg:</span>
        <ValidationStatus
          status={Status.ERROR}
          error="Connection timeout after 30 seconds"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All validation states side-by-side for comparison',
      },
    },
  },
};

/**
 * Dark mode compatibility
 */
export const DarkMode: Story = {
  args: {
    status: Status.CONNECTED,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Validation status badges use semantic tokens that adapt to dark mode',
      },
    },
  },
};

/**
 * Accessibility compliance (WCAG AA)
 */
export const Accessibility: Story = {
  args: {
    status: Status.CONNECTED,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Status uses icon + text (not just color), semantic color tokens, and title attribute for error details',
      },
    },
  },
};
