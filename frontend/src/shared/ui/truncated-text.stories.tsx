import type { Meta, StoryObj } from '@storybook/react-vite';
import { TruncatedText, TruncatedTitle } from './truncated-text';
import { TooltipProvider } from './tooltip';

const meta: Meta<typeof TruncatedText> = {
  title: 'Design System/UI/TruncatedText',
  component: TruncatedText,
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
          'Text with automatic tooltip on overflow. Shows a tooltip only when the text is actually truncated.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TruncatedText>;

// ===================================================================
// BASIC EXAMPLES
// ===================================================================

export const Default: Story = {
  args: {
    text: 'This is a very long text that will be truncated when it exceeds the container width',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 200 }}>
        <Story />
      </div>
    ),
  ],
};

export const ShortText: Story = {
  args: {
    text: 'Short text',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 200 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'When text fits within the container, no tooltip is shown.',
      },
    },
  },
};

export const NoTooltip: Story = {
  args: {
    text: 'Long text without tooltip even when truncated for accessibility reasons',
    showTooltip: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 200 }}>
        <Story />
      </div>
    ),
  ],
};

// ===================================================================
// MULTI-LINE EXAMPLES
// ===================================================================

export const TwoLines: Story = {
  args: {
    text: 'This is a longer paragraph that will be truncated after two lines. It demonstrates how multi-line truncation works with the line-clamp CSS property.',
    lines: 2,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 250 }}>
        <Story />
      </div>
    ),
  ],
};

export const ThreeLines: Story = {
  args: {
    text: 'This is an even longer paragraph that will be truncated after three lines. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
    lines: 3,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 250 }}>
        <Story />
      </div>
    ),
  ],
};

// ===================================================================
// ELEMENT VARIANTS
// ===================================================================

export const AsHeading: Story = {
  args: {
    text: 'Knowledge Extraction Pipeline Configuration',
    as: 'h2',
    className: 'text-xl font-bold',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 200 }}>
        <Story />
      </div>
    ),
  ],
};

export const AsParagraph: Story = {
  args: {
    text: 'This is a paragraph element with truncation enabled for long content.',
    as: 'p',
    lines: 2,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 250 }}>
        <Story />
      </div>
    ),
  ],
};

// ===================================================================
// TRUNCATED TITLE COMPONENT
// ===================================================================

export const TitleH3: StoryObj<typeof TruncatedTitle> = {
  render: () => (
    <div style={{ width: 180 }}>
      <TruncatedTitle
        text="Agent Configuration Settings Panel"
        level="h3"
      />
    </div>
  ),
};

export const TitleWithCustomStyle: StoryObj<typeof TruncatedTitle> = {
  render: () => (
    <div style={{ width: 200 }}>
      <TruncatedTitle
        text="Knowledge Extraction AI Pipeline"
        level="h2"
        className="text-lg text-primary"
      />
    </div>
  ),
};

// ===================================================================
// RESPONSIVE EXAMPLES
// ===================================================================

export const ResponsiveContainer: Story = {
  args: {
    text: 'This text adapts to the container width and shows tooltip when truncated on smaller screens',
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xs md:max-w-md lg:max-w-lg border border-dashed border-muted-foreground/50 p-4">
        <p className="text-xs text-muted-foreground mb-2">
          Resize your browser to see truncation behavior
        </p>
        <Story />
      </div>
    ),
  ],
};

// ===================================================================
// USAGE IN CARDS
// ===================================================================

export const InCardHeader: Story = {
  render: () => (
    <div className="border rounded-lg p-4 w-64">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <TruncatedTitle
            text="Knowledge Extraction Pipeline"
            level="h3"
            className="text-lg"
          />
          <TruncatedText
            text="AI-powered knowledge extraction from Telegram messages with semantic analysis"
            lines={2}
            className="text-sm text-muted-foreground mt-1"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common usage pattern in card headers with title and description.',
      },
    },
  },
};
