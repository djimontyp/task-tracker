import type { Meta, StoryObj } from '@storybook/react-vite';
import { SetupWizard } from './SetupWizard';
import { useTelegramStore } from '@/pages/SettingsPage/plugins/TelegramSource/useTelegramStore';

/**
 * Helper to set Telegram connection status for stories.
 * Must be called at module level before stories render.
 */
const setTelegramStatus = (status: 'unknown' | 'checking' | 'connected' | 'warning' | 'error') => {
  useTelegramStore.setState({ connectionStatus: status });
};

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
1. Connect Sources - Link Telegram/Slack (status derived from Telegram connection)
2. First Project - Create organizational structure
3. Activate Agent - Enable AI analysis
4. First Insight - Auto-completes when AI extracts knowledge

**Features:**
- Responsive grid (2x2 desktop, 1 col mobile)
- Step 1 status derived from real Telegram connection state
- Locked state with visual overlay
- Touch-friendly buttons (44px)
- Semantic tokens only
        `,
      },
    },
  },
  argTypes: {
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
// INITIAL STATE (Telegram not connected)
// ═══════════════════════════════════════════════════════════════

/**
 * Initial state - Telegram not connected, Step 1 active
 */
export const InitialState: Story = {
  args: {
    step2Status: 'locked',
    step3Status: 'locked',
    step4Status: 'locked',
  },
  decorators: [
    (Story) => {
      setTelegramStatus('unknown');
      return <Story />;
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// PROGRESS STATES
// ═══════════════════════════════════════════════════════════════

/**
 * Telegram connected, Step 1 completed, Step 2 now active
 */
export const TelegramConnected: Story = {
  args: {
    step2Status: 'active',
    step3Status: 'locked',
    step4Status: 'locked',
  },
  decorators: [
    (Story) => {
      setTelegramStatus('connected');
      return <Story />;
    },
  ],
};

/**
 * Telegram with warning status - still counts as connected
 */
export const TelegramWarning: Story = {
  args: {
    step2Status: 'active',
    step3Status: 'locked',
    step4Status: 'locked',
  },
  decorators: [
    (Story) => {
      setTelegramStatus('warning');
      return <Story />;
    },
  ],
};

/**
 * Steps 1-2 completed, Step 3 now active
 */
export const Step2Completed: Story = {
  args: {
    step2Status: 'completed',
    step3Status: 'active',
    step4Status: 'locked',
  },
  decorators: [
    (Story) => {
      setTelegramStatus('connected');
      return <Story />;
    },
  ],
};

/**
 * Steps 1-3 completed, waiting for first insight
 */
export const Step3Completed: Story = {
  args: {
    step2Status: 'completed',
    step3Status: 'completed',
    step4Status: 'pending',
  },
  decorators: [
    (Story) => {
      setTelegramStatus('connected');
      return <Story />;
    },
  ],
};

/**
 * All steps completed - wizard finished
 */
export const AllCompleted: Story = {
  args: {
    step2Status: 'completed',
    step3Status: 'completed',
    step4Status: 'completed',
  },
  decorators: [
    (Story) => {
      setTelegramStatus('connected');
      return <Story />;
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// RESPONSIVE LAYOUT
// ═══════════════════════════════════════════════════════════════

/**
 * Mobile viewport - shows single column layout
 */
export const MobileLayout: Story = {
  args: {
    step2Status: 'active',
    step3Status: 'locked',
    step4Status: 'locked',
  },
  decorators: [
    (Story) => {
      setTelegramStatus('connected');
      return <Story />;
    },
  ],
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
    step2Status: 'completed',
    step3Status: 'active',
    step4Status: 'locked',
  },
  decorators: [
    (Story) => {
      setTelegramStatus('connected');
      return <Story />;
    },
  ],
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
 * Telegram error state - Step 1 remains active
 */
export const TelegramError: Story = {
  args: {
    step2Status: 'locked',
    step3Status: 'locked',
    step4Status: 'locked',
  },
  decorators: [
    (Story) => {
      setTelegramStatus('error');
      return <Story />;
    },
  ],
};

/**
 * Telegram checking state - Step 1 remains active
 */
export const TelegramChecking: Story = {
  args: {
    step2Status: 'locked',
    step3Status: 'locked',
    step4Status: 'locked',
  },
  decorators: [
    (Story) => {
      setTelegramStatus('checking');
      return <Story />;
    },
  ],
};
