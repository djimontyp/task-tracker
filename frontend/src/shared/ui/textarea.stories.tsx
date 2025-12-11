import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Textarea } from './textarea';
import { Label } from './label';

/**
 * Textarea component for multi-line text entry.
 *
 * ## Design System Rules
 * - Minimum height 80px for usability
 * - Use resize-none class to prevent layout shifts
 * - Always pair with Label for accessibility
 * - Include character counter for limited input
 */
const meta: Meta<typeof Textarea> = {
  title: 'Primitives/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
    },
    required: {
      control: 'boolean',
    },
    rows: {
      control: 'number',
      description: 'Number of visible rows',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'Multi-line text input with auto-resize support. Always use with Label component.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

// Basic variants
export const Default: Story = {
  args: {
    placeholder: 'Type your message here...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-md gap-2">
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" placeholder="Type your message here..." />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Textarea with Label for accessibility. Always connect via htmlFor and id.',
      },
    },
  },
};

export const CustomRows: Story = {
  args: {
    placeholder: 'Larger textarea with 10 rows',
    rows: 10,
  },
};

export const NoResize: Story = {
  render: () => (
    <div className="grid w-full max-w-md gap-2">
      <Label htmlFor="fixed">Fixed size (no resize)</Label>
      <Textarea id="fixed" placeholder="Cannot be resized" className="resize-none" rows={4} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use resize-none class to prevent user from resizing.',
      },
    },
  },
};

// States
export const Disabled: Story = {
  args: {
    placeholder: 'Disabled textarea',
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    value: 'This is read-only content that cannot be edited.',
    readOnly: true,
  },
};

export const Required: Story = {
  render: () => (
    <div className="grid w-full max-w-md gap-2">
      <Label htmlFor="required">
        Description <span className="text-destructive">*</span>
      </Label>
      <Textarea id="required" placeholder="Required field" required />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="grid w-full max-w-md gap-2">
      <Label htmlFor="error">Feedback</Label>
      <Textarea
        id="error"
        placeholder="Enter your feedback"
        className="border-destructive focus-visible:ring-destructive"
        aria-invalid="true"
        aria-describedby="error-message"
      />
      <p id="error-message" className="text-sm text-destructive">
        Feedback must be at least 10 characters
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state with red border and error message. Use aria-invalid and aria-describedby.',
      },
    },
  },
};

// With character counter
export const WithCharacterCounter: Story = {
  render: () => {
    const [value, setValue] = React.useState('');
    const maxLength = 280;

    return (
      <div className="grid w-full max-w-md gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="tweet">Tweet</Label>
          <span className="text-sm text-muted-foreground">
            {value.length}/{maxLength}
          </span>
        </div>
        <Textarea
          id="tweet"
          placeholder="What's happening?"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={maxLength}
          rows={4}
          className="resize-none"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Textarea with character counter and maxLength validation.',
      },
    },
  },
};

// Form example
export const FeedbackForm: Story = {
  render: () => (
    <div className="grid w-full max-w-md gap-4">
      <div className="grid gap-2">
        <Label htmlFor="subject">Subject</Label>
        <Textarea id="subject" placeholder="Brief summary" rows={2} className="resize-none" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="details">Details</Label>
        <Textarea id="details" placeholder="Provide more information..." rows={6} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multi-textarea form with different sizes.',
      },
    },
  },
};
