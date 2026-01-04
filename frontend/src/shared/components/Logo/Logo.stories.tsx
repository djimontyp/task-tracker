import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { Logo } from './Logo'

const meta: Meta<typeof Logo> = {
  title: 'Patterns/Logo',
  component: Logo,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="p-8 bg-background">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  argTypes: {
    collapsed: {
      control: 'boolean',
      description: 'Hide text when true (for collapsed sidebar)',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Logo size: sm (32px), md (40px), lg (48px)',
    },
    animated: {
      control: 'boolean',
      description: 'Enable radar sweep rotation animation on hover',
    },
    showText: {
      control: 'boolean',
      description: 'Show "Pulse Radar" text next to icon',
    },
  },
}

export default meta
type Story = StoryObj<typeof Logo>

/**
 * Default logo with text and medium size.
 * This is the standard appearance for expanded sidebar.
 */
export const Default: Story = {
  args: {
    size: 'md',
    showText: true,
    collapsed: false,
    animated: false,
  },
}

/**
 * Icon-only variant (collapsed state).
 * Used when sidebar is collapsed - only shows radar icon.
 */
export const IconOnly: Story = {
  args: {
    size: 'md',
    showText: true,
    collapsed: true, // Text hidden when collapsed
    animated: false,
  },
}

/**
 * Small size (32px) - used in sidebar header.
 * Compact version for navigation areas.
 */
export const Small: Story = {
  args: {
    size: 'sm',
    showText: true,
    collapsed: false,
    animated: false,
  },
}

/**
 * Large size (48px) - decorative or hero usage.
 * Bigger variant for prominent placement.
 */
export const Large: Story = {
  args: {
    size: 'lg',
    showText: true,
    collapsed: false,
    animated: false,
  },
}

/**
 * Animated ring rotation on hover.
 * The outer ring rotates smoothly while the core pulses.
 * Try hovering over the logo to see the animation!
 */
export const Animated: Story = {
  args: {
    size: 'md',
    showText: true,
    collapsed: false,
    animated: true, // Ring rotates on hover
  },
}

/**
 * Mobile navbar variant.
 * Small size with text, commonly used in mobile top navbar.
 */
export const Mobile: Story = {
  args: {
    size: 'sm',
    showText: true,
    collapsed: false,
    animated: false,
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="p-4 bg-card border-b border-border flex items-center gap-4">
          <Story />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Menu items...</span>
          </div>
        </div>
      </MemoryRouter>
    ),
  ],
}

/**
 * All sizes comparison.
 * Visual comparison of all three logo sizes side by side.
 */
export const SizeComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-8 bg-background">
      <div className="flex items-center gap-4">
        <Logo size="sm" showText />
        <span className="text-sm text-muted-foreground">Small (32px)</span>
      </div>
      <div className="flex items-center gap-4">
        <Logo size="md" showText />
        <span className="text-sm text-muted-foreground">Medium (40px)</span>
      </div>
      <div className="flex items-center gap-4">
        <Logo size="lg" showText />
        <span className="text-sm text-muted-foreground">Large (48px)</span>
      </div>
    </div>
  ),
}

/**
 * Collapsed states comparison.
 * Shows how logo appears in expanded vs collapsed sidebar.
 */
export const CollapsedComparison: Story = {
  render: () => (
    <div className="flex gap-12 p-8 bg-background">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase">Expanded</span>
        <Logo size="sm" showText collapsed={false} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase">Collapsed</span>
        <Logo size="sm" showText collapsed={true} />
      </div>
    </div>
  ),
}

/**
 * Theme comparison - Light vs Dark.
 * Demonstrates logo visibility on both light and dark backgrounds.
 * Text uses sidebar-foreground token for proper theme adaptation.
 */
export const ThemeComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-0">
      {/* Light theme simulation */}
      <div className="p-8 bg-white" style={{ '--sidebar-foreground': '240 5.3% 26.1%' } as React.CSSProperties}>
        <div className="flex items-center gap-4">
          <Logo size="md" showText />
          <span className="text-sm text-slate-500">Light mode (white background)</span>
        </div>
      </div>
      {/* Dark theme simulation */}
      <div className="p-8 bg-slate-950" style={{ '--sidebar-foreground': '240 4.8% 95.9%' } as React.CSSProperties}>
        <div className="flex items-center gap-4">
          <Logo size="md" showText />
          <span className="text-sm text-slate-400">Dark mode (dark background)</span>
        </div>
      </div>
    </div>
  ),
}
