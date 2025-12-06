import type { Meta, StoryObj } from '@storybook/react';
import { Box, type SpacingToken, type BackgroundToken, type RoundedToken } from './Box';

const meta: Meta<typeof Box> = {
  title: 'Design System/Primitives/Box',
  component: Box,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Box is the foundational layout primitive. It provides a type-safe API for spacing,
background colors, and border radius through design tokens.

**Key features:**
- All spacing values follow the 4px grid system
- Background colors use semantic tokens for theme consistency
- Polymorphic \`as\` prop for semantic HTML elements

**When to use:**
- Simple containers with consistent padding/margin
- Sections with semantic HTML elements
- Backgrounds and rounded corners
        `,
      },
    },
  },
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as SpacingToken[],
      description: 'Uniform padding on all sides',
    },
    paddingX: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as SpacingToken[],
      description: 'Horizontal padding (left/right)',
    },
    paddingY: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as SpacingToken[],
      description: 'Vertical padding (top/bottom)',
    },
    background: {
      control: 'select',
      options: ['default', 'muted', 'accent', 'card', 'popover'] as BackgroundToken[],
      description: 'Background color using semantic tokens',
    },
    rounded: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'] as RoundedToken[],
      description: 'Border radius',
    },
    as: {
      control: 'select',
      options: ['div', 'section', 'article', 'aside', 'main', 'nav', 'header', 'footer'],
      description: 'HTML element to render',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Box>;

export const Default: Story = {
  args: {
    padding: 'md',
    children: 'Box content with default padding',
  },
};

export const WithBackground: Story = {
  args: {
    padding: 'lg',
    background: 'muted',
    rounded: 'lg',
    children: 'Box with muted background',
  },
};

export const CardStyle: Story = {
  args: {
    padding: 'lg',
    background: 'card',
    rounded: 'lg',
    className: 'border shadow-sm',
    children: 'Card-like box with shadow',
  },
};

export const SemanticSection: Story = {
  args: {
    as: 'section',
    padding: 'xl',
    background: 'muted',
    rounded: 'lg',
    children: (
      <div>
        <h2 className="text-lg font-semibold mb-2">Section Title</h2>
        <p className="text-muted-foreground">This is a semantic section element with box styling.</p>
      </div>
    ),
  },
};

export const SpacingShowcase: Story = {
  render: () => (
    <div className="space-y-4">
      {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as SpacingToken[]).map((size) => (
        <Box key={size} padding={size} background="muted" rounded="md">
          padding=&quot;{size}&quot; ({size === 'xs' ? '4px' : size === 'sm' ? '8px' : size === 'md' ? '16px' : size === 'lg' ? '24px' : size === 'xl' ? '32px' : '48px'})
        </Box>
      ))}
    </div>
  ),
};

export const BackgroundShowcase: Story = {
  render: () => (
    <div className="space-y-4">
      {(['default', 'muted', 'accent', 'card', 'popover'] as BackgroundToken[]).map((bg) => (
        <Box key={bg} padding="md" background={bg} rounded="md" className="border">
          background=&quot;{bg}&quot;
        </Box>
      ))}
    </div>
  ),
};

export const RoundedShowcase: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'] as RoundedToken[]).map((r) => (
        <Box key={r} padding="md" background="muted" rounded={r} className="w-24 h-24 flex items-center justify-center text-xs">
          {r}
        </Box>
      ))}
    </div>
  ),
};

export const DirectionalPadding: Story = {
  render: () => (
    <div className="space-y-4">
      <Box paddingX="xl" paddingY="sm" background="muted" rounded="md">
        paddingX=&quot;xl&quot; paddingY=&quot;sm&quot;
      </Box>
      <Box paddingTop="lg" paddingBottom="sm" paddingX="md" background="muted" rounded="md">
        paddingTop=&quot;lg&quot; paddingBottom=&quot;sm&quot;
      </Box>
    </div>
  ),
};
