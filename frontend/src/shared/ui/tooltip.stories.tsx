import type { Meta, StoryObj } from '@storybook/react-vite';
import { HelpCircle, Info, Trash2, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { Button } from './button';

/**
 * Tooltip component - brief informational text on hover/focus.
 *
 * ## Design System Rules
 * - Keyboard accessible: Shows on focus, hides on blur
 * - Delay: 700ms default before showing
 * - Keep text concise (1-2 lines max)
 * - Do NOT use for critical information (not accessible on touch)
 */
const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'A brief tooltip that appears on hover or focus. Keep text concise - not suitable for touch devices.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

// Default tooltip
export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This is a tooltip</p>
      </TooltipContent>
    </Tooltip>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Basic tooltip that appears on hover. Shows after 700ms delay.',
      },
    },
  },
};

// Icon button with tooltip
export const IconButton: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Help">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Show help documentation</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Open settings</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Delete">
            <Trash2 className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Delete item</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Icon buttons with tooltips. Essential for accessibility - explain what icon does.',
      },
    },
  },
};

// Different positions
export const Positions: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Top</Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Tooltip on top (default)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Right</Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Tooltip on right</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Tooltip on bottom</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Left</Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Tooltip on left</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tooltips can appear on any side: top (default), right, bottom, left.',
      },
    },
  },
};

// Help icon with info
export const HelpIcon: Story = {
  render: () => (
    <div className="inline-flex items-center gap-2">
      <label htmlFor="api-key" className="text-sm">
        API Key
      </label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="rounded-full hover:bg-accent" aria-label="API Key information">
            <Info className="h-4 w-4 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Your unique identifier for API requests</p>
        </TooltipContent>
      </Tooltip>
      <input
        id="api-key"
        type="text"
        placeholder="sk-..."
        className="rounded-md border px-4 py-2 text-sm"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Help icon with tooltip. Common pattern for inline contextual help.',
      },
    },
  },
};

// Long text (avoid this!)
export const LongText: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>
          This tooltip has too much text. Tooltips should be brief - 1-2 lines maximum. For longer
          content, use a Popover or Dialog instead.
        </p>
      </TooltipContent>
    </Tooltip>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ANTI-PATTERN: Tooltip with too much text. Use Popover for long content.',
      },
    },
  },
};

// Keyboard focus
export const KeyboardFocus: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Tab to me</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Shows on keyboard focus</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">And me</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Press Tab to navigate</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">And me too</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Accessible via keyboard</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tooltips show on keyboard focus. Press Tab to test accessibility.',
      },
    },
  },
};
