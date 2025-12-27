import type { Meta, StoryObj } from '@storybook/react-vite'
import { HumanizedLoader } from './index'

/**
 * HumanizedLoader displays friendly loading states with messages.
 *
 * ## Design System Rules
 * - Uses Spinner component with text message
 * - Text uses muted-foreground for subtle appearance
 * - Subtle pulse animation on text for visual feedback
 * - Centered layout with consistent spacing
 */
const meta: Meta<typeof HumanizedLoader> = {
  title: 'Patterns/HumanizedLoader',
  component: HumanizedLoader,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['analyzing', 'loading', 'connecting', 'processing'],
      description: 'Type of loading state',
    },
    message: {
      control: 'text',
      description: 'Custom message to display',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Spinner size',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A humanized loading component that displays friendly messages alongside a spinner, providing better UX than spinners alone.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof HumanizedLoader>

export const Analyzing: Story = {
  args: {
    variant: 'analyzing',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default message: "Analyzing context..."',
      },
    },
  },
}

export const Loading: Story = {
  args: {
    variant: 'loading',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default message: "Loading messages..."',
      },
    },
  },
}

export const Connecting: Story = {
  args: {
    variant: 'connecting',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default message: "Checking connection..."',
      },
    },
  },
}

export const Processing: Story = {
  args: {
    variant: 'processing',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default message: "Processing data..."',
      },
    },
  },
}

export const CustomMessage: Story = {
  args: {
    variant: 'loading',
    message: 'Fetching latest updates from server...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom message overrides the default variant message.',
      },
    },
  },
}

export const SmallSize: Story = {
  args: {
    variant: 'analyzing',
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Small spinner for inline or compact layouts.',
      },
    },
  },
}

export const LargeSize: Story = {
  args: {
    variant: 'processing',
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Large spinner for prominent loading states.',
      },
    },
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="border rounded-lg p-6">
        <HumanizedLoader variant="analyzing" />
      </div>
      <div className="border rounded-lg p-6">
        <HumanizedLoader variant="loading" />
      </div>
      <div className="border rounded-lg p-6">
        <HumanizedLoader variant="connecting" />
      </div>
      <div className="border rounded-lg p-6">
        <HumanizedLoader variant="processing" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All four variants side by side with their default messages.',
      },
    },
  },
}

export const UkrainianMessages: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="border rounded-lg p-6">
        <HumanizedLoader variant="analyzing" message="Аналізую контекст..." />
      </div>
      <div className="border rounded-lg p-6">
        <HumanizedLoader variant="loading" message="Завантажую повідомлення..." />
      </div>
      <div className="border rounded-lg p-6">
        <HumanizedLoader variant="connecting" message="Перевіряю зв'язок..." />
      </div>
      <div className="border rounded-lg p-6">
        <HumanizedLoader variant="processing" message="Обробляю дані..." />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ukrainian localized messages for all variants.',
      },
    },
  },
}

export const DarkMode: Story = {
  args: {
    variant: 'analyzing',
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'HumanizedLoader in dark mode theme.',
      },
    },
  },
}
