import type { Meta, StoryObj } from '@storybook/react-vite';
import { SetupWizard } from './SetupWizard';

const meta: Meta<typeof SetupWizard> = {
  title: 'Features/Onboarding/SetupWizard',
  component: SetupWizard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**SetupWizard** - Inline grid wizard for Dashboard cold start state.

Displays a 2x2 grid of setup steps on desktop (1 column on mobile).

**Steps:**
1. Connect Sources - Link Telegram/Slack
2. First Project - Create organizational structure
3. Activate Agent - Enable AI analysis
4. First Insight - Auto-completes when AI extracts knowledge

**Features:**
- Responsive grid (2x2 desktop, 1 col mobile)
- Step status indicators (pending, active, completed, locked)
- Locked state with visual overlay
- Touch-friendly buttons (44px)
- Semantic tokens only
        `,
      },
    },
  },
  argTypes: {
    step1Status: {
      control: 'select',
      options: ['pending', 'active', 'completed', 'locked'],
      description: 'Status for Connect Sources step',
    },
    step2Status: {
      control: 'select',
      options: ['pending', 'active', 'completed', 'locked'],
      description: 'Status for First Project step',
    },
    step3Status: {
      control: 'select',
      options: ['pending', 'active', 'completed', 'locked'],
      description: 'Status for Activate Agent step',
    },
    step4Status: {
      control: 'select',
      options: ['pending', 'active', 'completed', 'locked'],
      description: 'Status for First Insight step',
    },
  },
  args: {
    onConnectSource: () => console.log('Connect Source clicked'),
    onCreateProject: () => console.log('Create Project clicked'),
    onActivateAgent: () => console.log('Activate Agent clicked'),
  },
};

export default meta;
type Story = StoryObj<typeof SetupWizard>;

// ═══════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════

/**
 * All steps pending - fresh start state
 */
export const AllPending: Story = {
  args: {
    step1Status: 'active',
    step2Status: 'locked',
    step3Status: 'locked',
    step4Status: 'locked',
  },
};

// ═══════════════════════════════════════════════════════════════
// PROGRESS STATES
// ═══════════════════════════════════════════════════════════════

/**
 * Step 1 completed, Step 2 now active
 */
export const Step1Completed: Story = {
  args: {
    step1Status: 'completed',
    step2Status: 'active',
    step3Status: 'locked',
    step4Status: 'locked',
  },
};

/**
 * Steps 1-2 completed, Step 3 now active
 */
export const Step2Completed: Story = {
  args: {
    step1Status: 'completed',
    step2Status: 'completed',
    step3Status: 'active',
    step4Status: 'locked',
  },
};

/**
 * Steps 1-3 completed, waiting for first insight
 */
export const Step3Completed: Story = {
  args: {
    step1Status: 'completed',
    step2Status: 'completed',
    step3Status: 'completed',
    step4Status: 'pending',
  },
};

/**
 * All steps completed - wizard finished
 */
export const AllCompleted: Story = {
  args: {
    step1Status: 'completed',
    step2Status: 'completed',
    step3Status: 'completed',
    step4Status: 'completed',
  },
};

// ═══════════════════════════════════════════════════════════════
// RESPONSIVE LAYOUT
// ═══════════════════════════════════════════════════════════════

/**
 * Mobile viewport - shows single column layout
 */
export const MobileLayout: Story = {
  args: {
    step1Status: 'completed',
    step2Status: 'active',
    step3Status: 'locked',
    step4Status: 'locked',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet viewport - shows 2x2 grid
 */
export const TabletLayout: Story = {
  args: {
    step1Status: 'completed',
    step2Status: 'completed',
    step3Status: 'active',
    step4Status: 'locked',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

// ═══════════════════════════════════════════════════════════════
// EDGE CASES
// ═══════════════════════════════════════════════════════════════

/**
 * All locked - unusual state for testing
 */
export const AllLocked: Story = {
  args: {
    step1Status: 'locked',
    step2Status: 'locked',
    step3Status: 'locked',
    step4Status: 'locked',
  },
};

/**
 * Multiple active steps - parallel execution possible
 */
export const MultipleActive: Story = {
  args: {
    step1Status: 'active',
    step2Status: 'active',
    step3Status: 'pending',
    step4Status: 'locked',
  },
};
