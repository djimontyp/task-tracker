import type { Meta, StoryObj } from '@storybook/react';
import { ScoreIndicator } from './ScoreIndicator';

const meta: Meta<typeof ScoreIndicator> = {
  title: 'Features/Noise/ScoreIndicator',
  component: ScoreIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A 5-dot visual indicator for message importance scores.

**Score Levels:**
- **Critical** (5 dots): score >= 0.9 - Red
- **High** (4 dots): score >= 0.7 - Yellow/Warning
- **Medium** (3 dots): score >= 0.5 - Blue/Info
- **Low** (2 dots): score >= 0.3 - Gray
- **Noise** (1 dot): score < 0.3 - Faded gray

Includes tooltip with exact percentage. Label mode shows text alongside dots.
        `,
      },
    },
  },
  argTypes: {
    score: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'Importance score from 0 to 1',
    },
    showLabel: {
      control: 'boolean',
      description: 'Show text label alongside dots',
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScoreIndicator>;

// Default story
export const Default: Story = {
  args: {
    score: 0.75,
    showLabel: false,
    size: 'md',
  },
};

// With label
export const WithLabel: Story = {
  args: {
    score: 0.85,
    showLabel: true,
    size: 'md',
  },
};

// All levels showcase
export const AllLevels: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm font-medium mb-2">All Score Levels:</div>
      {[0.95, 0.75, 0.55, 0.35, 0.15].map((score) => (
        <div key={score} className="flex items-center gap-4">
          <ScoreIndicator score={score} showLabel size="md" />
          <span className="text-xs text-muted-foreground font-mono">
            score: {score}
          </span>
        </div>
      ))}
    </div>
  ),
};

// Size variants
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm font-medium mb-2">Size Variants:</div>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="flex items-center gap-4">
          <span className="w-8 text-xs text-muted-foreground">{size}:</span>
          <ScoreIndicator score={0.72} size={size} showLabel />
        </div>
      ))}
    </div>
  ),
};

// Critical score
export const Critical: Story = {
  args: {
    score: 0.95,
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Critical importance (score >= 0.9). All 5 dots active with red color.',
      },
    },
  },
};

// High score
export const High: Story = {
  args: {
    score: 0.78,
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'High importance (score >= 0.7). 4 dots active with warning color.',
      },
    },
  },
};

// Medium score
export const Medium: Story = {
  args: {
    score: 0.55,
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Medium importance (score >= 0.5). 3 dots active with info color.',
      },
    },
  },
};

// Low score
export const Low: Story = {
  args: {
    score: 0.35,
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Low importance (score >= 0.3). 2 dots active with muted color.',
      },
    },
  },
};

// Noise score
export const Noise: Story = {
  args: {
    score: 0.15,
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Noise level (score < 0.3). Only 1 dot active, very faded.',
      },
    },
  },
};

// Edge cases
export const EdgeCases: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm font-medium mb-2">Edge Cases:</div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-xs text-muted-foreground">Zero:</span>
        <ScoreIndicator score={0} showLabel />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-xs text-muted-foreground">Maximum:</span>
        <ScoreIndicator score={1} showLabel />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-xs text-muted-foreground">Threshold 0.9:</span>
        <ScoreIndicator score={0.9} showLabel />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-xs text-muted-foreground">Below 0.9:</span>
        <ScoreIndicator score={0.89} showLabel />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Testing boundary conditions at 0, 1, and threshold values.',
      },
    },
  },
};

// In context
export const InContext: Story = {
  render: () => (
    <div className="p-4 border rounded-lg bg-card max-w-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            JD
          </div>
          <span className="text-sm font-medium">John Doe</span>
        </div>
        <ScoreIndicator score={0.82} size="sm" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Important message about the project deadline...
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ScoreIndicator used in a typical message card context.',
      },
    },
  },
};
