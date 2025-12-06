import type { Meta, StoryObj } from '@storybook/react-vite';
import { ServiceStatusIndicator } from './ServiceStatusIndicator';

const meta: Meta<typeof ServiceStatusIndicator> = {
  title: 'Layout/ServiceStatusIndicator',
  component: ServiceStatusIndicator,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center p-8 bg-background">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Displays service health status with a colored dot indicator. Uses semantic design tokens for consistent styling.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['healthy', 'warning', 'error'],
      description: 'Current service status',
    },
    showLabel: {
      control: 'boolean',
      description: 'Show text label next to dot',
    },
    ariaLabel: {
      control: 'text',
      description: 'Custom label for screen readers',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ServiceStatusIndicator>;

/** Healthy status - green dot indicating service is operational. */
export const Healthy: Story = {
  args: {
    status: 'healthy',
  },
};

/** Warning status - yellow dot indicating service instability. */
export const Warning: Story = {
  args: {
    status: 'warning',
  },
};

/** Error status - red dot indicating service is offline. */
export const Error: Story = {
  args: {
    status: 'error',
  },
};

/** Healthy status with visible "Online" label. */
export const HealthyWithLabel: Story = {
  args: {
    status: 'healthy',
    showLabel: true,
  },
};

/** Warning status with visible "Unstable" label. */
export const WarningWithLabel: Story = {
  args: {
    status: 'warning',
    showLabel: true,
  },
};

/** Error status with visible "Offline" label. */
export const ErrorWithLabel: Story = {
  args: {
    status: 'error',
    showLabel: true,
  },
};

/** All status variants displayed together for comparison. */
export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-8">
        <ServiceStatusIndicator status="healthy" showLabel />
        <ServiceStatusIndicator status="warning" showLabel />
        <ServiceStatusIndicator status="error" showLabel />
      </div>
      <div className="flex items-center gap-8">
        <ServiceStatusIndicator status="healthy" />
        <ServiceStatusIndicator status="warning" />
        <ServiceStatusIndicator status="error" />
      </div>
    </div>
  ),
};
