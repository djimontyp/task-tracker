import type { Meta, StoryObj } from '@storybook/react-vite';
import { OnboardingWelcome, OnboardingWelcomeCompact } from './OnboardingWelcome';

const meta: Meta<typeof OnboardingWelcome> = {
  title: 'Features/Extraction/OnboardingWelcome',
  component: OnboardingWelcome,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A welcoming first-run experience for new users with clear value proposition and dual CTAs.

## Features
- **Step Indicator**: Shows progress through the onboarding flow
- **Value Propositions**: Three key benefits with icons
- **Stats Banner**: "500 messages to 5 decisions" visualization
- **Dual CTAs**: Try Demo (explorers) and Connect Telegram (doers)
- **Keyboard Shortcuts**: Enter for connect, D for demo

## Accessibility
- Full keyboard navigation
- WCAG AA compliant
- Screen reader optimized
- Reduced motion support
        `,
      },
    },
  },
  argTypes: {
    currentStep: {
      control: 'select',
      options: ['welcome', 'connect', 'configure', 'complete'],
      description: 'Current onboarding step',
    },
    demoMessageCount: {
      control: { type: 'number', min: 100, max: 10000 },
      description: 'Number of demo messages to show',
    },
    userName: {
      control: 'text',
      description: 'User name for personalized greeting',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OnboardingWelcome>;

export const Default: Story = {
  args: {
    onTryDemo: () => console.log('onTryDemo'),
    onConnectTelegram: () => console.log('onConnectTelegram'),
    onSkip: () => console.log('onSkip'),
    currentStep: 'welcome',
    demoMessageCount: 500,
  },
};

export const WithUserName: Story = {
  args: {
    ...Default.args,
    userName: 'Alex',
  },
  parameters: {
    docs: {
      description: {
        story: 'Personalized greeting when user name is known.',
      },
    },
  },
};

export const HighVolume: Story = {
  args: {
    ...Default.args,
    demoMessageCount: 5000,
  },
  parameters: {
    docs: {
      description: {
        story: 'With high message volume, the value proposition becomes even more compelling.',
      },
    },
  },
};

export const StepConnect: Story = {
  args: {
    ...Default.args,
    currentStep: 'connect',
  },
  parameters: {
    docs: {
      description: {
        story: 'Progress indicator showing the connect step.',
      },
    },
  },
};

export const StepConfigure: Story = {
  args: {
    ...Default.args,
    currentStep: 'configure',
  },
  parameters: {
    docs: {
      description: {
        story: 'Progress indicator showing the configure step.',
      },
    },
  },
};

export const StepComplete: Story = {
  args: {
    ...Default.args,
    currentStep: 'complete',
  },
  parameters: {
    docs: {
      description: {
        story: 'Progress indicator showing completion.',
      },
    },
  },
};

// Compact variant stories
export const Compact: StoryObj<typeof OnboardingWelcomeCompact> = {
  render: () => (
    <div className="p-8 max-w-lg">
      <OnboardingWelcomeCompact
        onTryDemo={() => console.log('onTryDemo')}
        onConnectTelegram={() => console.log('onConnectTelegram')}
        onDismiss={() => console.log('onDismiss')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact variant for dashboard cards or modals.',
      },
    },
  },
};

export const CompactNoDismiss: StoryObj<typeof OnboardingWelcomeCompact> = {
  render: () => (
    <div className="p-8 max-w-lg">
      <OnboardingWelcomeCompact
        onTryDemo={() => console.log('onTryDemo')}
        onConnectTelegram={() => console.log('onConnectTelegram')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact variant without dismiss button (for required onboarding).',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Dark mode appearance.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark bg-background min-h-screen">
        <Story />
      </div>
    ),
  ],
};
