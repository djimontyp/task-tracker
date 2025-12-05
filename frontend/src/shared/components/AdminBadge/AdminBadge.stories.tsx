import type { Meta, StoryObj } from '@storybook/react-vite'
import { AdminBadge } from './AdminBadge'

/**
 * AdminBadge displays the current user mode (Admin or User).
 *
 * ## Design System Rules
 * - Admin mode uses semantic-warning color with shield icon
 * - User mode uses neutral colors with user icon
 * - Icon + text for accessibility (not just color)
 * - 44px minimum touch target when interactive
 */
const meta: Meta<typeof AdminBadge> = {
  title: 'Shared/AdminBadge',
  component: AdminBadge,
  tags: ['autodocs'],
  argTypes: {
    isAdminMode: {
      control: 'boolean',
      description: 'Whether admin mode is active',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'A badge component to indicate admin or user mode with icons and semantic colors.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof AdminBadge>

export const UserMode: Story = {
  args: {
    isAdminMode: false,
  },
}

export const AdminMode: Story = {
  args: {
    isAdminMode: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin mode shown with semantic-warning color and shield icon.',
      },
    },
  },
}

// Comparison
export const Comparison: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-muted-foreground mb-2">User Mode:</p>
        <AdminBadge isAdminMode={false} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Admin Mode:</p>
        <AdminBadge isAdminMode={true} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of user and admin modes.',
      },
    },
  },
}

// Dark mode
export const DarkMode: Story = {
  args: {
    isAdminMode: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Admin badge in dark mode theme.',
      },
    },
  },
}
