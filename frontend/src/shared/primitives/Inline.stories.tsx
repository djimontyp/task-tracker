import type { Meta, StoryObj } from '@storybook/react';
import { Inline, type AlignToken, type JustifyToken } from './Inline';
import { type SpacingToken } from './Box';
import { Check, X, Settings, User, Mail } from 'lucide-react';

const meta: Meta<typeof Inline> = {
  title: 'Design System/Primitives/Inline',
  component: Inline,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Inline is a horizontal layout primitive for inline elements like buttons,
badges, icons with text, or any row of items.

**Features:**
- \`wrap\` prop enables responsive wrapping
- \`justify\` prop for horizontal distribution
- \`align\` prop for vertical alignment

**When to use:**
- Button groups
- Icon + text combinations
- Tag/badge lists
- Any content that flows left-to-right
        `,
      },
    },
  },
  argTypes: {
    gap: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as SpacingToken[],
      description: 'Gap between inline items',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'baseline', 'stretch'] as AlignToken[],
      description: 'Vertical alignment of items',
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'between', 'around', 'evenly'] as JustifyToken[],
      description: 'Horizontal distribution of items',
    },
    wrap: {
      control: 'boolean',
      description: 'Allow items to wrap',
    },
    reverse: {
      control: 'boolean',
      description: 'Reverse order of items',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Inline>;

export const Default: Story = {
  args: {
    gap: 'sm',
    children: (
      <>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
          Primary
        </button>
        <button className="border px-4 py-2 rounded-md">
          Secondary
        </button>
        <button className="border px-4 py-2 rounded-md">
          Cancel
        </button>
      </>
    ),
  },
};

export const IconWithText: Story = {
  render: () => (
    <div className="space-y-4">
      <Inline gap="xs" align="center">
        <Check className="h-4 w-4 text-semantic-success" />
        <span>Connected</span>
      </Inline>
      <Inline gap="xs" align="center">
        <X className="h-4 w-4 text-destructive" />
        <span>Disconnected</span>
      </Inline>
      <Inline gap="sm" align="center">
        <Settings className="h-5 w-5" />
        <span className="font-medium">Settings</span>
      </Inline>
    </div>
  ),
};

export const JustifyShowcase: Story = {
  render: () => (
    <div className="space-y-4">
      {(['start', 'center', 'end', 'between'] as JustifyToken[]).map((justify) => (
        <div key={justify}>
          <p className="text-sm font-medium mb-2">justify=&quot;{justify}&quot;</p>
          <Inline gap="sm" justify={justify} className="border border-dashed p-4 rounded-md">
            <div className="bg-primary/20 px-4 py-2 rounded">A</div>
            <div className="bg-primary/20 px-4 py-2 rounded">B</div>
            <div className="bg-primary/20 px-4 py-2 rounded">C</div>
          </Inline>
        </div>
      ))}
    </div>
  ),
};

export const AlignmentShowcase: Story = {
  render: () => (
    <div className="space-y-4">
      {(['start', 'center', 'end', 'baseline'] as AlignToken[]).map((align) => (
        <div key={align}>
          <p className="text-sm font-medium mb-2">align=&quot;{align}&quot;</p>
          <Inline gap="sm" align={align} className="border border-dashed p-4 rounded-md">
            <div className="bg-primary/20 px-4 py-2 rounded text-xs">Small</div>
            <div className="bg-primary/20 px-4 py-6 rounded text-lg">Large</div>
            <div className="bg-primary/20 px-4 py-3 rounded">Medium</div>
          </Inline>
        </div>
      ))}
    </div>
  ),
};

export const Wrapping: Story = {
  args: {
    gap: 'sm',
    wrap: true,
    className: 'max-w-md',
    children: (
      <>
        {['React', 'TypeScript', 'Tailwind', 'Storybook', 'Vite', 'ESLint', 'Prettier', 'Zustand'].map((tag) => (
          <span key={tag} className="bg-muted px-3 py-1 rounded-full text-sm">
            {tag}
          </span>
        ))}
      </>
    ),
  },
};

export const NavigationExample: Story = {
  render: () => (
    <Inline gap="md" justify="between" align="center" className="border-b pb-4">
      <Inline gap="sm" align="center">
        <div className="h-8 w-8 bg-primary rounded-md" />
        <span className="font-semibold">Brand</span>
      </Inline>
      <Inline gap="lg">
        <a href="#" className="text-muted-foreground hover:text-foreground">Home</a>
        <a href="#" className="text-muted-foreground hover:text-foreground">Products</a>
        <a href="#" className="text-muted-foreground hover:text-foreground">About</a>
      </Inline>
      <Inline gap="sm">
        <User className="h-5 w-5" />
        <Mail className="h-5 w-5" />
      </Inline>
    </Inline>
  ),
};

export const Reversed: Story = {
  args: {
    gap: 'sm',
    reverse: true,
    children: (
      <>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
          First (now right)
        </button>
        <button className="border px-4 py-2 rounded-md">
          Second
        </button>
        <button className="border px-4 py-2 rounded-md">
          Third (now left)
        </button>
      </>
    ),
  },
};
