import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  StatusBadgesExample,
  SemanticBadgesExample,
  InteractiveCardExample,
  EmptyStateExample,
  ResponsiveGridExample,
  AlertCardsExample,
  TokensDemo,
} from './ExampleTokenUsage';

/**
 * Design Tokens Usage Examples
 *
 * This demonstrates how to use TypeScript design tokens
 * instead of raw Tailwind classes.
 *
 * ## Benefits
 * - Type-safe: Autocomplete in IDE
 * - Consistent: Same patterns across codebase
 * - Refactorable: Change once, update everywhere
 * - ESLint-friendly: No raw color violations
 *
 * @see @/shared/tokens
 */
const meta: Meta = {
  title: 'Patterns/DesignTokensExample',
  parameters: {
    docs: {
      description: {
        component:
          'Examples of using TypeScript design tokens for consistent, type-safe styling.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

/**
 * Full demo with all token examples
 */
export const AllExamples: Story = {
  render: () => <TokensDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Complete demonstration of design tokens usage patterns.',
      },
    },
  },
};

/**
 * Status badges (connected, validating, pending, error)
 */
export const StatusBadges: Story = {
  render: () => <StatusBadgesExample />,
  parameters: {
    docs: {
      description: {
        story: 'Type-safe status badges using `badges.status.*` tokens.',
      },
      source: {
        code: `
import { badges } from '@/shared/tokens';

<Badge className={badges.status.connected}>
  <CheckCircleIcon className="h-3.5 w-3.5" />
  Connected
</Badge>
        `,
      },
    },
  },
};

/**
 * Semantic badges (success, warning, error, info)
 */
export const SemanticBadges: Story = {
  render: () => <SemanticBadgesExample />,
  parameters: {
    docs: {
      description: {
        story: 'Semantic badges using `badges.semantic.*` tokens.',
      },
      source: {
        code: `
import { badges } from '@/shared/tokens';

<Badge className={badges.semantic.success}>
  <CheckCircleIcon className="h-3.5 w-3.5" />
  Success
</Badge>
        `,
      },
    },
  },
};

/**
 * Interactive card with hover effects
 */
export const InteractiveCard: Story = {
  render: () => <InteractiveCardExample />,
  parameters: {
    docs: {
      description: {
        story: 'Card with hover, focus, and scale effects using `cards.interactive` token.',
      },
      source: {
        code: `
import { cards } from '@/shared/tokens';

<Card className={cards.interactive}>
  {/* Content */}
</Card>
        `,
      },
    },
  },
};

/**
 * Empty state with consistent spacing
 */
export const EmptyState: Story = {
  render: () => <EmptyStateExample />,
  parameters: {
    docs: {
      description: {
        story: 'Empty state using `emptyState.*` tokens for consistent layout.',
      },
      source: {
        code: `
import { emptyState } from '@/shared/tokens';

<div className={emptyState.container}>
  <div className={emptyState.icon}>
    <Icon className="h-8 w-8" />
  </div>
  <h3 className={emptyState.title}>No items</h3>
  <p className={emptyState.description}>Description</p>
</div>
        `,
      },
    },
  },
};

/**
 * Responsive grid with consistent gaps
 */
export const ResponsiveGrid: Story = {
  render: () => <ResponsiveGridExample />,
  parameters: {
    docs: {
      description: {
        story: 'Grid that adapts to screen size using `lists.grid.responsive` token.',
      },
      source: {
        code: `
import { lists } from '@/shared/tokens';

<div className={lists.grid.responsive}>
  {items.map(item => <Card key={item.id} />)}
</div>
        `,
      },
    },
  },
};

/**
 * Alert cards with semantic colors
 */
export const AlertCards: Story = {
  render: () => <AlertCardsExample />,
  parameters: {
    docs: {
      description: {
        story: 'Alert cards using `cards.alert.*` tokens for different message types.',
      },
      source: {
        code: `
import { cards } from '@/shared/tokens';

<div className={cards.alert.error}>
  <h4>Error Alert</h4>
  <p>This is an error message</p>
</div>
        `,
      },
    },
  },
};
