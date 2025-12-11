import type { Meta, StoryObj } from '@storybook/react-vite';
import { Settings, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';
import { Badge } from './badge';

/**
 * Card component for grouped content.
 *
 * ## Design System Rules
 * - Use consistent padding: CardHeader and CardContent have p-6 by default
 * - CardContent has pt-0 to connect visually with header
 * - For compact cards, override with className="pb-2" on CardHeader
 */
const meta: Meta<typeof Card> = {
  title: 'Primitives/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A container component for grouping related content with consistent styling.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

// Basic card
export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content with any elements you need.</p>
      </CardContent>
    </Card>
  ),
};

// With footer
export const WithFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Manage your account settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Configure your preferences and security options.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  ),
};

// Compact header
export const CompactHeader: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader className="pb-2">
        <CardTitle>Compact Card</CardTitle>
        <CardDescription>Reduced header padding.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">Use pb-2 on CardHeader for tighter layouts.</p>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `className="pb-2"` on CardHeader for compact layouts.',
      },
    },
  },
};

// With icon and badge
export const WithIconAndBadge: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Configuration</CardTitle>
          </div>
          <Badge variant="success">Active</Badge>
        </div>
        <CardDescription>System configuration panel.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          All systems operational.
        </p>
      </CardContent>
    </Card>
  ),
};

// Clickable card
export const Clickable: Story = {
  render: () => (
    <Card className="w-[350px] cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Clickable Card</CardTitle>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
        <CardDescription>Click to navigate somewhere.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Hover effect shows interactivity.
        </p>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive card with hover effects. Use `hover:shadow-lg hover:scale-[1.01]` for subtle feedback.',
      },
    },
  },
};

// Grid of cards
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle>Card {i}</CardTitle>
            <CardDescription>Description for card {i}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Content for card {i}.
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Responsive grid layout: 1 column on mobile, 2 on tablet, 3 on desktop.',
      },
    },
  },
};

// Empty state card
export const EmptyState: Story = {
  render: () => (
    <Card className="w-[400px] border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Settings className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No items yet</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Get started by creating your first item.
        </p>
        <Button className="mt-4">Create Item</Button>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state pattern with dashed border, centered icon, and CTA button.',
      },
    },
  },
};

// Glow variants
export const WithHoverGlow: Story = {
  render: () => (
    <div className="p-8 bg-background">
      <p className="text-sm text-muted-foreground mb-4">Hover to see glow effect</p>
      <Card className="w-[350px] cursor-pointer transition-all duration-300 hover:shadow-glow-hover hover:scale-[1.01]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Featured Card</CardTitle>
            </div>
            <Badge variant="success">New</Badge>
          </div>
          <CardDescription>Important content with glow effect.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Hover to see subtle glow highlighting this card.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card with subtle glow effect on hover. Used for important/featured items that need visual emphasis.',
      },
    },
  },
};

export const FeaturedWithGlow: Story = {
  render: () => (
    <div className="p-8 bg-background">
      <p className="text-sm text-muted-foreground mb-4">Always-on glow for featured content</p>
      <Card className="w-[350px] shadow-glow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Featured Content</CardTitle>
            </div>
            <Badge>Featured</Badge>
          </div>
          <CardDescription>Highlighted with persistent glow.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This card has always-on glow effect to draw attention.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Featured card with persistent glow effect. Draws attention to critical or important content.',
      },
    },
  },
};
