import type { Meta, StoryObj } from '@storybook/react-vite';
import { Center, type MaxWidthToken } from './Center';

const meta: Meta<typeof Center> = {
  title: 'Layout/Center',
  component: Center,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Center is a simple centering primitive that centers its children
horizontally and/or vertically.

**When to use:**
- Login/signup pages (\`fullHeight\`)
- Empty states
- Page headers with centered text
- Max-width content containers
        `,
      },
    },
  },
  argTypes: {
    fullHeight: {
      control: 'boolean',
      description: 'Center vertically (takes full height)',
    },
    maxWidth: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full', 'prose'] as MaxWidthToken[],
      description: 'Maximum width constraint',
    },
    inline: {
      control: 'boolean',
      description: 'Use inline-flex instead of flex',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Center>;

export const Default: Story = {
  args: {
    children: (
      <div className="bg-muted p-8 rounded-lg text-center">
        <h2 className="text-lg font-semibold">Centered Content</h2>
        <p className="text-muted-foreground">This content is horizontally centered</p>
      </div>
    ),
  },
};

export const WithMaxWidth: Story = {
  args: {
    maxWidth: '2xl',
    children: (
      <div className="bg-muted p-8 rounded-lg">
        <h2 className="text-lg font-semibold">Constrained Width</h2>
        <p className="text-muted-foreground">
          This content is centered and constrained to max-w-2xl (672px).
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>
    ),
  },
};

export const FullHeightCentered: Story = {
  args: {
    fullHeight: true,
    children: (
      <div className="text-center">
        <div className="h-16 w-16 bg-primary rounded-full mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
        <p className="text-muted-foreground">Sign in to continue to your account</p>
      </div>
    ),
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="h-[500px] border rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
};

export const MaxWidthShowcase: Story = {
  render: () => (
    <div className="space-y-8 p-4">
      {(['sm', 'md', 'lg', 'xl', '2xl', '3xl'] as MaxWidthToken[]).map((width) => (
        <div key={width}>
          <p className="text-sm font-medium mb-2">maxWidth=&quot;{width}&quot;</p>
          <Center maxWidth={width}>
            <div className="bg-primary/10 border border-dashed p-4 rounded-md w-full text-center">
              Content with max-w-{width}
            </div>
          </Center>
        </div>
      ))}
    </div>
  ),
};

export const EmptyStateExample: Story = {
  args: {
    maxWidth: 'md',
    className: 'text-center py-12',
    children: (
      <div>
        <div className="h-16 w-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">📭</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
        <p className="text-muted-foreground mb-4">
          Messages will appear here once you start receiving them.
        </p>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
          Send First Message
        </button>
      </div>
    ),
  },
};

export const InlineCenter: Story = {
  render: () => (
    <div className="space-y-4">
      <p>Inline centering is useful for icons or small elements:</p>
      <Center inline className="bg-muted p-2 rounded-full">
        <span className="text-xl">🎯</span>
      </Center>
    </div>
  ),
};

export const LoginPage: Story = {
  args: {
    fullHeight: true,
    maxWidth: 'sm',
  },
  render: (args) => (
    <Center {...args}>
      <div className="w-full p-6 border rounded-lg shadow-sm bg-card">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input className="w-full border rounded-md px-3 py-2" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Password</label>
            <input type="password" className="w-full border rounded-md px-3 py-2" placeholder="******" />
          </div>
          <button className="w-full bg-primary text-primary-foreground py-2 rounded-md">
            Sign In
          </button>
        </div>
      </div>
    </Center>
  ),
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="h-[600px] border rounded-lg overflow-hidden bg-muted/50">
        <Story />
      </div>
    ),
  ],
};
