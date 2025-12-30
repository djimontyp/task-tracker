import type { Meta, StoryObj } from '@storybook/react-vite';
import { MetricCardSkeleton, MetricCardSkeletonGrid } from './MetricCardSkeleton';

const meta: Meta<typeof MetricCardSkeleton> = {
  title: 'Components/Skeletons/MetricCardSkeleton',
  component: MetricCardSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Content-aware skeleton for DashboardMetrics component. Matches the layout of MetricCard with icon, value, and label.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof MetricCardSkeleton>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Single metric card skeleton with icon, trend indicator, value, and label.',
      },
    },
  },
};

export const Grid: Story = {
  render: () => <MetricCardSkeletonGrid count={4} />,
  parameters: {
    docs: {
      description: {
        story: 'Grid of 4 metric cards - standard dashboard layout.',
      },
    },
  },
};

export const GridWithCustomCount: Story = {
  render: () => <MetricCardSkeletonGrid count={6} />,
  parameters: {
    docs: {
      description: {
        story: 'Grid with 6 metric cards for expanded dashboards.',
      },
    },
  },
};

export const TwoColumns: Story = {
  render: () => <MetricCardSkeletonGrid count={2} />,
  parameters: {
    docs: {
      description: {
        story: 'Grid with 2 metric cards for compact layouts.',
      },
    },
  },
};

export const InContainer: Story = {
  render: () => (
    <div className="max-w-4xl mx-auto">
      <MetricCardSkeletonGrid count={4} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Metric grid in a constrained container, similar to dashboard widget.',
      },
    },
  },
};
