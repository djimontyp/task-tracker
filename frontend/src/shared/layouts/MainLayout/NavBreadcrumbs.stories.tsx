import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { NavBreadcrumbs } from './NavBreadcrumbs';
import type { BreadcrumbSegment } from './useBreadcrumbs';

const meta: Meta<typeof NavBreadcrumbs> = {
  title: 'Layout/NavBreadcrumbs',
  component: NavBreadcrumbs,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="p-4 bg-background">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Renders breadcrumb navigation with mobile/desktop variants. 44px touch targets for WCAG 2.5.5 compliance.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['desktop', 'mobile'],
      description: 'Styling variant',
    },
    maxWidth: {
      control: 'text',
      description: 'Maximum width for each crumb (CSS value)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NavBreadcrumbs>;

const simpleCrumbs: BreadcrumbSegment[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Messages' },
];

const deepCrumbs: BreadcrumbSegment[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'AI Analysis', href: '/analysis' },
  { label: 'Runs', href: '/analysis/runs' },
  { label: 'Run #1234' },
];

const longLabelCrumbs: BreadcrumbSegment[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'My Super Long Project Name That Should Truncate' },
];

/** Simple two-level breadcrumb navigation. */
export const Default: Story = {
  args: {
    crumbs: simpleCrumbs,
    variant: 'desktop',
  },
};

/** Desktop variant with deep hierarchy. */
export const Desktop: Story = {
  args: {
    crumbs: deepCrumbs,
    variant: 'desktop',
  },
};

/** Mobile variant with smaller text and tighter spacing. */
export const Mobile: Story = {
  args: {
    crumbs: deepCrumbs,
    variant: 'mobile',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

/** Deep navigation hierarchy with five levels. */
export const DeepHierarchy: Story = {
  args: {
    crumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Settings', href: '/settings' },
      { label: 'AI Config', href: '/settings/ai' },
      { label: 'Providers', href: '/settings/ai/providers' },
      { label: 'OpenAI' },
    ],
    variant: 'desktop',
  },
};

/** Long labels truncate with ellipsis. */
export const LongLabels: Story = {
  args: {
    crumbs: longLabelCrumbs,
    variant: 'desktop',
  },
};

/** Custom max-width for narrower breadcrumbs. */
export const CustomMaxWidth: Story = {
  args: {
    crumbs: longLabelCrumbs,
    variant: 'desktop',
    maxWidth: '100px',
  },
};

/** Single item (root page, no links). */
export const SingleItem: Story = {
  args: {
    crumbs: [{ label: 'Dashboard' }],
    variant: 'desktop',
  },
};

/** Comparison of mobile vs desktop variants. */
export const VariantComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs text-muted-foreground mb-2">Desktop variant:</p>
        <NavBreadcrumbs crumbs={deepCrumbs} variant="desktop" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Mobile variant:</p>
        <NavBreadcrumbs crumbs={deepCrumbs} variant="mobile" />
      </div>
    </div>
  ),
};
