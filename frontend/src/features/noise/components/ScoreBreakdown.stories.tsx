import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScoreBreakdown, type ScoreFactors } from './ScoreBreakdown';

const meta: Meta<typeof ScoreBreakdown> = {
  title: 'Features/Noise/ScoreBreakdown',
  component: ScoreBreakdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Expanded breakdown of the 4 scoring factors that compose the importance score.

**Factors:**
- **Content (40%)**: Message relevance and keywords
- **Author (20%)**: Sender authority and history
- **Temporal (20%)**: Time-based relevance
- **Topics (20%)**: Topic alignment

Each factor displays a labeled progress bar with percentage.
Optionally shows weighted contribution values.
        `,
      },
    },
  },
  argTypes: {
    showWeights: {
      control: 'boolean',
      description: 'Show weighted contribution values',
    },
    compact: {
      control: 'boolean',
      description: 'Compact horizontal layout',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ScoreBreakdown>;

// Sample factor configurations
const highScoreFactors: ScoreFactors = {
  content: 0.9,
  author: 0.85,
  temporal: 0.75,
  topics: 0.8,
};

const mixedFactors: ScoreFactors = {
  content: 0.65,
  author: 0.4,
  temporal: 0.9,
  topics: 0.25,
};

const lowScoreFactors: ScoreFactors = {
  content: 0.2,
  author: 0.15,
  temporal: 0.3,
  topics: 0.1,
};

const contentHeavyFactors: ScoreFactors = {
  content: 0.95,
  author: 0.2,
  temporal: 0.1,
  topics: 0.15,
};

// Default story
export const Default: Story = {
  args: {
    factors: highScoreFactors,
    showWeights: true,
    compact: false,
  },
};

// Without weights
export const WithoutWeights: Story = {
  args: {
    factors: mixedFactors,
    showWeights: false,
    compact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Simpler view without weighted contribution values.',
      },
    },
  },
};

// Compact mode
export const Compact: Story = {
  args: {
    factors: highScoreFactors,
    showWeights: false,
    compact: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Compact 2x2 grid layout for space-constrained contexts.',
      },
    },
  },
};

// High score breakdown
export const HighScore: Story = {
  args: {
    factors: highScoreFactors,
    showWeights: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'All factors scoring high - signal message pattern.',
      },
    },
  },
};

// Low score breakdown
export const LowScore: Story = {
  args: {
    factors: lowScoreFactors,
    showWeights: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'All factors scoring low - noise message pattern.',
      },
    },
  },
};

// Mixed factors
export const MixedFactors: Story = {
  args: {
    factors: mixedFactors,
    showWeights: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Varied factor scores - common pattern with temporal spike.',
      },
    },
  },
};

// Content-heavy
export const ContentHeavy: Story = {
  args: {
    factors: contentHeavyFactors,
    showWeights: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'High content score but low other factors - keyword match without context.',
      },
    },
  },
};

// Comparison view
export const Comparison: Story = {
  render: () => (
    <div className="space-y-6 w-[450px]">
      <div>
        <h3 className="text-sm font-medium mb-2">Signal Message</h3>
        <ScoreBreakdown factors={highScoreFactors} showWeights />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Noise Message</h3>
        <ScoreBreakdown factors={lowScoreFactors} showWeights />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of signal vs noise patterns.',
      },
    },
  },
};

// Edge cases
export const EdgeCases: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div>
        <h3 className="text-sm font-medium mb-2">All Zeros</h3>
        <ScoreBreakdown
          factors={{ content: 0, author: 0, temporal: 0, topics: 0 }}
          showWeights
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">All Maximum</h3>
        <ScoreBreakdown
          factors={{ content: 1, author: 1, temporal: 1, topics: 1 }}
          showWeights
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Threshold Values (0.5)</h3>
        <ScoreBreakdown
          factors={{ content: 0.5, author: 0.5, temporal: 0.5, topics: 0.5 }}
          showWeights
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Testing boundary conditions with all zeros, maximums, and thresholds.',
      },
    },
  },
};

// In message detail context
export const InContext: Story = {
  render: () => (
    <div className="p-6 border rounded-lg bg-card max-w-md space-y-4">
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Message Analysis</h3>
          <span className="text-xs text-muted-foreground">ID: msg_123</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed score breakdown for this message
        </p>
      </div>
      <ScoreBreakdown factors={mixedFactors} showWeights />
      <div className="pt-4 border-t text-xs text-muted-foreground">
        Last analyzed: 2 hours ago
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ScoreBreakdown used in a message detail view context.',
      },
    },
  },
};
