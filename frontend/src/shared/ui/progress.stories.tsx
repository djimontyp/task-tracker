import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './progress';

/**
 * Progress component for displaying task completion or loading progress.
 *
 * ## Design System Rules
 * - MUST include aria-label for screen readers (WCAG)
 * - Uses semantic colors: `bg-primary` for progress bar
 * - Height: 2 units (8px) for visual balance
 * - Smooth transitions (300ms) for value changes
 */
const meta: Meta<typeof Progress> = {
  title: 'Primitives/Progress',
  component: Progress,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Current progress value (0-100)',
    },
    max: {
      control: { type: 'number' },
      description: 'Maximum value (default: 100)',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'Accessible progress bar with ARIA attributes and smooth animations.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 60,
    'aria-label': 'Progress: 60%',
  },
};

export const Empty: Story = {
  args: {
    value: 0,
    'aria-label': 'Progress: 0%',
  },
  parameters: {
    docs: {
      description: {
        story: 'Progress bar at 0% - initial state.',
      },
    },
  },
};

export const Quarter: Story = {
  args: {
    value: 25,
    'aria-label': 'Progress: 25%',
  },
};

export const Half: Story = {
  args: {
    value: 50,
    'aria-label': 'Progress: 50%',
  },
};

export const ThreeQuarters: Story = {
  args: {
    value: 75,
    'aria-label': 'Progress: 75%',
  },
};

export const Complete: Story = {
  args: {
    value: 100,
    'aria-label': 'Progress: 100%',
  },
  parameters: {
    docs: {
      description: {
        story: 'Progress bar at 100% - completed state.',
      },
    },
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Uploading files...</span>
        <span className="text-muted-foreground">45%</span>
      </div>
      <Progress value={45} aria-label="Upload progress: 45%" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Progress with label and percentage display above the bar.',
      },
    },
  },
};

export const CustomMax: Story = {
  render: () => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Processing 35 of 50 items</span>
        <span className="text-muted-foreground">70%</span>
      </div>
      <Progress value={35} max={50} aria-label="Processing 35 of 50 items" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Progress with custom max value (not 100).',
      },
    },
  },
};

export const MultipleSteps: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step 1: Uploading</span>
          <span className="text-status-connected">Complete</span>
        </div>
        <Progress value={100} aria-label="Step 1: Complete" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step 2: Processing</span>
          <span className="text-muted-foreground">60%</span>
        </div>
        <Progress value={60} aria-label="Step 2: 60% complete" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step 3: Finalizing</span>
          <span className="text-muted-foreground">Pending</span>
        </div>
        <Progress value={0} aria-label="Step 3: Pending" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multi-step progress indicator showing different completion states.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Small (h-1)</p>
        <Progress value={60} className="h-1" aria-label="Small progress: 60%" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Default (h-2)</p>
        <Progress value={60} aria-label="Default progress: 60%" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Large (h-4)</p>
        <Progress value={60} className="h-4" aria-label="Large progress: 60%" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different progress bar heights via className override.',
      },
    },
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      {[0, 25, 50, 75, 100].map((value) => (
        <div key={value} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{value}%</span>
          </div>
          <Progress value={value} aria-label={`Progress: ${value}%`} />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All progress states from 0% to 100% in 25% increments.',
      },
    },
  },
};
