import type { Meta, StoryObj } from '@storybook/react-vite'
import { SaveStatusIndicator } from './SaveStatusIndicator'

/**
 * SaveStatusIndicator shows the current save state with icon and timestamp.
 *
 * ## Design System Rules
 * - Uses semantic colors (semantic-info, semantic-success, semantic-error, semantic-warning)
 * - Icons paired with text for accessibility
 * - Animated transitions for state changes
 */
const meta: Meta<typeof SaveStatusIndicator> = {
  title: 'Patterns/SaveStatusIndicator',
  component: SaveStatusIndicator,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['idle', 'saving', 'saved', 'error'],
      description: 'Current save status',
    },
    hasUnsavedChanges: {
      control: 'boolean',
      description: 'Whether there are unsaved changes',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'Displays save status with icon, text, and optional timestamp.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof SaveStatusIndicator>

// Status variants
export const Saving: Story = {
  args: {
    status: 'saving',
    hasUnsavedChanges: true,
    lastSavedAt: null,
  },
}

export const Saved: Story = {
  args: {
    status: 'saved',
    hasUnsavedChanges: false,
    lastSavedAt: new Date(Date.now() - 5000), // 5 seconds ago
  },
}

export const SavedRecently: Story = {
  args: {
    status: 'saved',
    hasUnsavedChanges: false,
    lastSavedAt: new Date(Date.now() - 2000), // 2 seconds ago
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows "just now" for saves within 10 seconds.',
      },
    },
  },
}

export const SavedMinutesAgo: Story = {
  args: {
    status: 'saved',
    hasUnsavedChanges: false,
    lastSavedAt: new Date(Date.now() - 120000), // 2 minutes ago
  },
}

export const SavedHoursAgo: Story = {
  args: {
    status: 'saved',
    hasUnsavedChanges: false,
    lastSavedAt: new Date(Date.now() - 7200000), // 2 hours ago
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows time in HH:MM format for saves older than 1 hour.',
      },
    },
  },
}

export const Error: Story = {
  args: {
    status: 'error',
    hasUnsavedChanges: true,
    lastSavedAt: new Date(Date.now() - 60000), // 1 minute ago
  },
}

export const UnsavedChanges: Story = {
  args: {
    status: 'idle',
    hasUnsavedChanges: true,
    lastSavedAt: new Date(Date.now() - 300000), // 5 minutes ago
  },
}

export const AllSaved: Story = {
  args: {
    status: 'idle',
    hasUnsavedChanges: false,
    lastSavedAt: new Date(Date.now() - 600000), // 10 minutes ago
  },
}

// Live simulation
export const LiveSimulation: Story = {
  render: () => {
    const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const [lastSaved, setLastSaved] = React.useState<Date | null>(null)

    React.useEffect(() => {
      const interval = setInterval(() => {
        // Simulate typing
        setStatus('idle')

        // Trigger save after 2 seconds
        setTimeout(() => {
          setStatus('saving')

          // Complete save after 1 second
          setTimeout(() => {
            setStatus('saved')
            setLastSaved(new Date())
          }, 1000)
        }, 2000)
      }, 6000)

      return () => clearInterval(interval)
    }, [])

    return (
      <SaveStatusIndicator
        status={status}
        hasUnsavedChanges={status === 'idle'}
        lastSavedAt={lastSaved}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Live simulation of save lifecycle: idle → saving → saved (repeats every 6 seconds).',
      },
    },
  },
}

// React import for LiveSimulation
import React from 'react'
