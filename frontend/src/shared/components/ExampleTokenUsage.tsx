/**
 * Example: Using TypeScript Design Tokens
 *
 * This component demonstrates how to use design tokens
 * instead of raw Tailwind classes.
 *
 * @see @/shared/tokens
 * @see docs/design-system/README.md
 */

import {
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { badges, cards, gap, emptyState, lists } from '@/shared/tokens';
import { cn } from '@/shared/lib/utils';

/**
 * Example 1: Status badges with type-safe tokens
 */
export function StatusBadgesExample() {
  return (
    <div className={cn('flex flex-wrap', gap.md)}>
      {/* Connected status */}
      <Badge variant="outline" className={badges.status.connected}>
        <CheckCircle className="h-3.5 w-3.5" />
        Connected
      </Badge>

      {/* Validating status */}
      <Badge variant="outline" className={badges.status.validating}>
        <Clock className="h-3.5 w-3.5" />
        Validating
      </Badge>

      {/* Pending status */}
      <Badge variant="outline" className={badges.status.pending}>
        <Clock className="h-3.5 w-3.5" />
        Pending
      </Badge>

      {/* Error status */}
      <Badge variant="outline" className={badges.status.error}>
        <XCircle className="h-3.5 w-3.5" />
        Error
      </Badge>
    </div>
  );
}

/**
 * Example 2: Semantic badges (success, warning, error, info)
 */
export function SemanticBadgesExample() {
  return (
    <div className={cn('flex flex-wrap', gap.md)}>
      <Badge variant="outline" className={badges.semantic.success}>
        <CheckCircle className="h-3.5 w-3.5" />
        Success
      </Badge>

      <Badge variant="outline" className={badges.semantic.warning}>
        <AlertCircle className="h-3.5 w-3.5" />
        Warning
      </Badge>

      <Badge variant="outline" className={badges.semantic.error}>
        <XCircle className="h-3.5 w-3.5" />
        Error
      </Badge>

      <Badge variant="outline" className={badges.semantic.info}>
        <AlertCircle className="h-3.5 w-3.5" />
        Info
      </Badge>
    </div>
  );
}

/**
 * Example 3: Interactive card with proper spacing
 */
export function InteractiveCardExample() {
  return (
    <Card className={cards.interactive}>
      <CardHeader>
        <CardTitle>Interactive Card</CardTitle>
        <CardDescription>Click me to see hover effect</CardDescription>
      </CardHeader>
      <CardContent className={gap.md}>
        <p>This card uses the `cards.interactive` token.</p>
        <p>It includes hover, focus, and scale effects.</p>
      </CardContent>
    </Card>
  );
}

/**
 * Example 4: Empty state with consistent styling
 */
export function EmptyStateExample() {
  return (
    <div className={emptyState.container}>
      <div className={emptyState.icon}>
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className={emptyState.title}>No items found</h3>
      <p className={emptyState.description}>
        This empty state uses tokens for consistent spacing and typography
      </p>
    </div>
  );
}

/**
 * Example 5: Responsive grid with consistent gaps
 */
export function ResponsiveGridExample() {
  const items = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    title: `Item ${i + 1}`,
  }));

  return (
    <div className={lists.grid.responsive}>
      {items.map((item) => (
        <Card key={item.id} className={cards.default}>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            Uses `lists.grid.responsive` for consistent responsive behavior
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Example 6: Alert cards with semantic colors
 */
export function AlertCardsExample() {
  return (
    <div className={cn('space-y-4')}>
      <div className={cards.alert.info}>
        <h4 className="font-semibold mb-2">Info Alert</h4>
        <p className="text-sm">This is an informational message.</p>
      </div>

      <div className={cards.alert.warning}>
        <h4 className="font-semibold mb-2">Warning Alert</h4>
        <p className="text-sm">This is a warning message.</p>
      </div>

      <div className={cards.alert.error}>
        <h4 className="font-semibold mb-2">Error Alert</h4>
        <p className="text-sm">This is an error message.</p>
      </div>

      <div className={cards.alert.success}>
        <h4 className="font-semibold mb-2">Success Alert</h4>
        <p className="text-sm">This is a success message.</p>
      </div>
    </div>
  );
}

/**
 * Example 7: All examples in one demo component
 */
export function TokensDemo() {
  return (
    <div className="p-6 space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Status Badges</h2>
        <StatusBadgesExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Semantic Badges</h2>
        <SemanticBadgesExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Interactive Card</h2>
        <div className="max-w-md">
          <InteractiveCardExample />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Empty State</h2>
        <EmptyStateExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Alert Cards</h2>
        <div className="max-w-lg">
          <AlertCardsExample />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Responsive Grid</h2>
        <ResponsiveGridExample />
      </section>
    </div>
  );
}
