import type { Meta, StoryObj } from '@storybook/react-vite';
import { HighlightedText } from './highlightRenderer';

const meta: Meta<typeof HighlightedText> = {
  title: 'Components/SearchBar/HighlightedText',
  component: HighlightedText,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Safely renders HTML snippets with highlighted search matches. Sanitizes input to only allow <mark> tags.',
      },
    },
  },
  argTypes: {
    html: {
      control: 'text',
      description: 'HTML string with <mark> tags for highlights',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};
export default meta;

type Story = StoryObj<typeof HighlightedText>;

export const Default: Story = {
  args: {
    html: 'This is a <mark>highlighted</mark> text example.',
    className: 'text-sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic highlighted text with single match.',
      },
    },
  },
};

export const MultipleHighlights: Story = {
  args: {
    html: 'The <mark>React</mark> framework uses <mark>hooks</mark> for state management.',
    className: 'text-sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Text with multiple highlighted terms.',
      },
    },
  },
};

export const NoHighlights: Story = {
  args: {
    html: 'Plain text without any highlights.',
    className: 'text-sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Text without any <mark> tags.',
      },
    },
  },
};

export const WithStyling: Story = {
  args: {
    html: 'Using <mark>TypeScript</mark> for type safety.',
    className: 'text-sm [&>mark]:bg-highlight [&>mark]:px-0.5 [&>mark]:rounded',
  },
  parameters: {
    docs: {
      description: {
        story: 'Highlighted text with custom mark styling (yellow background, rounded).',
      },
    },
  },
};

export const HTMLEntitiesHandling: Story = {
  args: {
    html: 'Handling &lt;script&gt; and <mark>safe</mark> content.',
    className: 'text-sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates safe handling of HTML entities.',
      },
    },
  },
};

export const InSearchContext: Story = {
  render: () => (
    <div className="w-80 space-y-2 p-4 border rounded-lg">
      <div className="flex items-start gap-2">
        <span className="text-muted-foreground">Result 1:</span>
        <HighlightedText
          html="Using <mark>React</mark> <mark>hooks</mark> for state"
          className="text-sm [&>mark]:bg-highlight [&>mark]:px-0.5 [&>mark]:rounded"
        />
      </div>
      <div className="flex items-start gap-2">
        <span className="text-muted-foreground">Result 2:</span>
        <HighlightedText
          html="Custom <mark>hooks</mark> best practices"
          className="text-sm [&>mark]:bg-highlight [&>mark]:px-0.5 [&>mark]:rounded"
        />
      </div>
      <div className="flex items-start gap-2">
        <span className="text-muted-foreground">Result 3:</span>
        <HighlightedText
          html="<mark>React</mark> Query vs Redux"
          className="text-sm [&>mark]:bg-highlight [&>mark]:px-0.5 [&>mark]:rounded"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple highlighted results in a search context.',
      },
    },
  },
};

export const Truncated: Story = {
  args: {
    html: 'This is a very long text that contains <mark>highlighted</mark> content and should be truncated when it exceeds the container width using line-clamp utilities.',
    className: 'text-sm line-clamp-1 [&>mark]:bg-highlight [&>mark]:px-0.5 [&>mark]:rounded',
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Highlighted text with truncation for long content.',
      },
    },
  },
};

export const DifferentColors: Story = {
  render: () => (
    <div className="space-y-3">
      <div>
        <span className="text-xs text-muted-foreground block mb-1">Default (yellow)</span>
        <HighlightedText
          html="<mark>Highlighted</mark> text"
          className="[&>mark]:bg-highlight [&>mark]:px-1 [&>mark]:rounded"
        />
      </div>
      <div>
        <span className="text-xs text-muted-foreground block mb-1">Primary</span>
        <HighlightedText
          html="<mark>Highlighted</mark> text"
          className="[&>mark]:bg-primary/20 [&>mark]:text-primary [&>mark]:px-1 [&>mark]:rounded"
        />
      </div>
      <div>
        <span className="text-xs text-muted-foreground block mb-1">Success</span>
        <HighlightedText
          html="<mark>Highlighted</mark> text"
          className="[&>mark]:bg-semantic-success/20 [&>mark]:text-semantic-success [&>mark]:px-1 [&>mark]:rounded"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different highlight color schemes via className.',
      },
    },
  },
};
