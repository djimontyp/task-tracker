/**
 * Storybook Stories - Minimal Onboarding Wizard
 *
 * Demonstrates the refined, minimal aesthetic:
 * - Breathing room over density
 * - Progressive disclosure
 * - Subtle state transitions
 * - Editorial typography hierarchy
 */

import type { Meta, StoryObj } from '@storybook/react'
import { BrowserRouter } from 'react-router-dom'
import { MinimalOnboardingWizard } from './MinimalOnboardingWizard'

const meta = {
  title: 'Features/Onboarding/MinimalOnboardingWizard',
  component: MinimalOnboardingWizard,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="min-h-screen bg-background p-8">
          <div className="mx-auto max-w-md">
            {/* Mock hero section context */}
            <div className="mb-8 space-y-2">
              <h1 className="text-2xl font-semibold">Доброго вечора, Макс!</h1>
              <p className="text-sm text-muted-foreground">
                Тиша в ефірі. Підключіть джерела даних.
              </p>
            </div>

            {/* Wizard component */}
            <Story />
          </div>
        </div>
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MinimalOnboardingWizard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Initial State - Step 1 Active
 *
 * User just arrived, needs to connect Telegram.
 * Shows:
 * - Active step expanded with CTA
 * - Upcoming steps locked (dashed outline)
 * - Progress bar at 0%
 * - Minimal visual hierarchy
 */
export const Step1Active: Story = {
  args: {
    step1Complete: false,
    step2Complete: false,
    step3Complete: false,
    step4Complete: false,
    onNavigate: (route) => console.log('Navigate to:', route),
    onDismiss: () => console.log('Dismissed'),
  },
}

/**
 * Step 2 Active - Progress Made
 *
 * User connected Telegram, now creating project.
 * Shows:
 * - Step 1 collapsed with checkmark
 * - Step 2 expanded with CTA
 * - Steps 3-4 still locked
 * - Progress bar at 25%
 */
export const Step2Active: Story = {
  args: {
    step1Complete: true,
    step2Complete: false,
    step3Complete: false,
    step4Complete: false,
    onNavigate: (route) => console.log('Navigate to:', route),
    onDismiss: () => console.log('Dismissed'),
  },
}

/**
 * Step 3 Active - Almost Done
 *
 * User created project, now enabling AI agent.
 * Shows:
 * - Steps 1-2 collapsed with checkmarks
 * - Step 3 expanded with CTA
 * - Step 4 locked
 * - Progress bar at 50%
 */
export const Step3Active: Story = {
  args: {
    step1Complete: true,
    step2Complete: true,
    step3Complete: false,
    step4Complete: false,
    onNavigate: (route) => console.log('Navigate to:', route),
    onDismiss: () => console.log('Dismissed'),
  },
}

/**
 * Setup Complete - Collapsed Banner
 *
 * User completed manual steps (1-3).
 * Step 4 (import) is automatic.
 *
 * Shows:
 * - Collapsed banner with success message
 * - "Listening for data" context
 * - Subtle animated progress bar
 * - Dismissible
 *
 * **Key Design Moment**: This is where the wizard
 * "gets out of the way" and lets the user focus
 * on the dashboard. Breathing room restored.
 */
export const SetupComplete: Story = {
  args: {
    step1Complete: true,
    step2Complete: true,
    step3Complete: true,
    step4Complete: false,
    onNavigate: (route) => console.log('Navigate to:', route),
    onDismiss: () => console.log('Dismissed'),
  },
}

/**
 * Fully Complete - Dismissed
 *
 * All steps done, wizard disappears.
 * Shows: Nothing (component returns null)
 *
 * **Design Philosophy**: The best UI is invisible.
 * Once setup is complete, the wizard gracefully exits.
 */
export const FullyComplete: Story = {
  args: {
    step1Complete: true,
    step2Complete: true,
    step3Complete: true,
    step4Complete: true,
    onNavigate: (route) => console.log('Navigate to:', route),
    onDismiss: () => console.log('Dismissed'),
  },
}

/**
 * Interactive Playground
 *
 * Test different step combinations and interactions.
 * Use Storybook controls to toggle step completion.
 */
export const Playground: Story = {
  args: {
    step1Complete: false,
    step2Complete: false,
    step3Complete: false,
    step4Complete: false,
    onNavigate: (route) => {
      console.log('Navigate to:', route)
      alert(`Would navigate to: ${route}`)
    },
    onDismiss: () => {
      console.log('Dismissed')
      alert('Wizard dismissed')
    },
  },
  argTypes: {
    step1Complete: {
      control: 'boolean',
      description: 'Telegram connection completed',
    },
    step2Complete: {
      control: 'boolean',
      description: 'Project created',
    },
    step3Complete: {
      control: 'boolean',
      description: 'AI agent enabled',
    },
    step4Complete: {
      control: 'boolean',
      description: 'Data imported',
    },
  },
}

/**
 * Dark Mode Comparison
 *
 * Verify the wizard looks great in dark theme.
 * The refined aesthetic should shine in both light and dark.
 */
export const DarkMode: Story = {
  args: {
    step1Complete: false,
    step2Complete: false,
    step3Complete: false,
    step4Complete: false,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
}

/**
 * Mobile View
 *
 * Wizard adapts gracefully to narrow viewports.
 * Button becomes full-width on mobile.
 */
export const Mobile: Story = {
  args: {
    step1Complete: false,
    step2Complete: false,
    step3Complete: false,
    step4Complete: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}
