import type { Meta, StoryObj } from '@storybook/react';
import { Stack, type AlignToken } from './Stack';
import { type SpacingToken } from './Box';

const meta: Meta<typeof Stack> = {
  title: 'Design System/Primitives/Stack',
  component: Stack,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Stack is a vertical layout primitive that uses CSS gap for consistent spacing.

**Benefits over raw \`space-y-*\`:**
- Gap works correctly with conditional children
- Gap doesn't affect first/last element margins
- Type-safe API prevents magic values

**When to use:**
- Vertical lists of items
- Form fields
- Card sections
- Any content that flows top-to-bottom
        `,
      },
    },
  },
  argTypes: {
    gap: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as SpacingToken[],
      description: 'Gap between stack items',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch', 'baseline'] as AlignToken[],
      description: 'Horizontal alignment of items',
    },
    reverse: {
      control: 'boolean',
      description: 'Reverse order of items',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Stack>;

const DemoItem = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-muted p-4 rounded-md border text-center">{children}</div>
);

export const Default: Story = {
  args: {
    gap: 'md',
    children: (
      <>
        <DemoItem>Item 1</DemoItem>
        <DemoItem>Item 2</DemoItem>
        <DemoItem>Item 3</DemoItem>
      </>
    ),
  },
};

export const GapShowcase: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-8">
      {(['sm', 'md', 'lg'] as SpacingToken[]).map((gap) => (
        <div key={gap}>
          <p className="text-sm font-medium mb-2">gap=&quot;{gap}&quot;</p>
          <Stack gap={gap}>
            <DemoItem>Item 1</DemoItem>
            <DemoItem>Item 2</DemoItem>
            <DemoItem>Item 3</DemoItem>
          </Stack>
        </div>
      ))}
    </div>
  ),
};

export const AlignmentShowcase: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-8">
      {(['start', 'center', 'end'] as AlignToken[]).map((align) => (
        <div key={align}>
          <p className="text-sm font-medium mb-2">align=&quot;{align}&quot;</p>
          <Stack gap="sm" align={align} className="border border-dashed p-4 rounded-md">
            <div className="bg-primary/20 px-4 py-2 rounded">Short</div>
            <div className="bg-primary/20 px-8 py-2 rounded">Medium content</div>
            <div className="bg-primary/20 px-2 py-2 rounded">A</div>
          </Stack>
        </div>
      ))}
    </div>
  ),
};

export const Reversed: Story = {
  args: {
    gap: 'md',
    reverse: true,
    children: (
      <>
        <DemoItem>First (now at bottom)</DemoItem>
        <DemoItem>Second</DemoItem>
        <DemoItem>Third (now at top)</DemoItem>
      </>
    ),
  },
};

export const FormExample: Story = {
  render: () => (
    <Stack gap="lg" className="max-w-md">
      <Stack gap="sm">
        <label className="text-sm font-medium">Email</label>
        <input className="border rounded-md px-3 py-2" placeholder="you@example.com" />
      </Stack>
      <Stack gap="sm">
        <label className="text-sm font-medium">Password</label>
        <input type="password" className="border rounded-md px-3 py-2" placeholder="******" />
      </Stack>
      <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
        Sign In
      </button>
    </Stack>
  ),
};

export const CardContent: Story = {
  render: () => (
    <div className="border rounded-lg p-6 max-w-sm">
      <Stack gap="md">
        <h3 className="text-lg font-semibold">Card Title</h3>
        <p className="text-muted-foreground text-sm">
          This is card content organized with Stack for consistent vertical spacing.
        </p>
        <div className="flex gap-2">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">
            Primary
          </button>
          <button className="border px-4 py-2 rounded-md text-sm">
            Secondary
          </button>
        </div>
      </Stack>
    </div>
  ),
};
