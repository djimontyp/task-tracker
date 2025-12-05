# TypeScript Design Tokens

> **Type-safe, autocomplete-friendly styling utilities for consistent UI development**

## 🎯 Why Use Tokens?

```tsx
// ❌ Before: Manual Tailwind classes (error-prone)
<Badge className="flex items-center gap-1.5 border-status-connected text-status-connected bg-status-connected/10">

// ✅ After: Type-safe tokens (autocomplete, refactorable)
import { badges } from '@/shared/tokens';
<Badge className={badges.status.connected}>
```

**Benefits:**
- ✅ **Autocomplete** — IDE shows available tokens
- ✅ **Type safety** — Impossible to use non-existent tokens
- ✅ **Consistency** — Everyone uses the same patterns
- ✅ **Refactoring** — Change once, update everywhere
- ✅ **ESLint friendly** — No raw color violations

---

## 📦 Token Categories

### 1. Colors (`colors.ts`)

Semantic color utilities that work in both light and dark mode.

```tsx
import { semantic, status, atom, chart, brand, base } from '@/shared/tokens';

// Semantic colors (general purpose)
semantic.success.bg       // bg-semantic-success
semantic.error.text       // text-semantic-error
semantic.warning.border   // border-semantic-warning

// Status colors (connection states)
status.connected.bg       // bg-status-connected
status.validating.text    // text-status-validating
status.error.border       // border-status-error

// Atom type colors (knowledge atoms)
atom.problem.bg           // bg-atom-problem
atom.solution.text        // text-atom-solution

// Chart colors (data visualization)
chart.signal.fill         // fill-chart-signal
chart.noise.stroke        // stroke-chart-noise

// Brand colors
brand.telegram.bg         // bg-brand-telegram

// Base shadcn/ui colors
base.primary.bg           // bg-primary
base.muted.foreground     // text-muted-foreground
```

### 2. Spacing (`spacing.ts`)

Consistent spacing utilities (4px grid system).

```tsx
import { gap, padding, spacing, touchTarget, radius } from '@/shared/tokens';

// Gap utilities (Flexbox/Grid)
gap.sm                    // gap-2 (8px)
gap.md                    // gap-4 (16px)
gap.lg                    // gap-6 (24px)

// Padding utilities
padding.card.default      // p-6 (24px)
padding.button.md         // px-4 py-2
padding.section.mobile    // p-4 (mobile)

// Stack spacing (vertical rhythm)
spacing.stack.md          // space-y-4
spacing.inline.sm         // space-x-2

// Touch targets (WCAG 2.5.5 compliant)
touchTarget.min           // h-11 w-11 (44px minimum)
touchTarget.comfortable   // h-12 w-12 (48px)

// Border radius
radius.md                 // rounded-md
radius.lg                 // rounded-lg
radius.full               // rounded-full
```

### 3. Patterns (`patterns.ts`)

Pre-built component patterns for common UI elements.

```tsx
import { badges, cards, buttons, emptyState, lists, focus } from '@/shared/tokens';

// Badge patterns
badges.status.connected   // Status badge with proper colors + spacing
badges.semantic.success   // Semantic badge (success/warning/error)
badges.atom.problem       // Atom type badge

// Card patterns
cards.default             // Standard card with padding
cards.interactive         // Clickable card with hover effects
cards.empty               // Empty state card (dashed border)
cards.alert.error         // Alert card with semantic color

// Button patterns
buttons.icon.default      // Icon button (44px - WCAG compliant)
buttons.withIcon          // Button with icon + text layout

// Empty state patterns
emptyState.container      // Empty state wrapper
emptyState.icon           // Icon container with muted background
emptyState.title          // Title text styling

// List patterns
lists.grid.responsive     // Responsive grid (1/2/3/4 cols)
lists.grid.dense          // Dense grid (1/2/3/4 cols)
lists.divided             // Vertical list with dividers

// Focus patterns (accessibility)
focus.ring                // Focus ring (WCAG 2.4.7)
focus.ringOnDark          // Focus ring for dark backgrounds
```

---

## 🚀 Usage Examples

### Status Badges

```tsx
import { badges } from '@/shared/tokens';
import { CheckCircle } from 'lucide-react';

<Badge variant="outline" className={badges.status.connected}>
  <CheckCircle className="h-3.5 w-3.5" />
  Connected
</Badge>
```

### Interactive Cards

```tsx
import { cards, gap } from '@/shared/tokens';

<Card className={cards.interactive}>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent className={gap.md}>
    Content
  </CardContent>
</Card>
```

### Empty States

```tsx
import { emptyState } from '@/shared/tokens';
import { Inbox } from 'lucide-react';

<div className={emptyState.container}>
  <div className={emptyState.icon}>
    <Inbox className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className={emptyState.title}>No items yet</h3>
  <p className={emptyState.description}>
    Add your first item to get started
  </p>
</div>
```

### Responsive Grids

```tsx
import { lists } from '@/shared/tokens';

<div className={lists.grid.responsive}>
  {items.map(item => (
    <Card key={item.id}>
      {/* Card content */}
    </Card>
  ))}
</div>
```

### Alert Cards

```tsx
import { cards } from '@/shared/tokens';

<div className={cards.alert.error}>
  <h4 className="font-semibold mb-2">Error</h4>
  <p className="text-sm">Something went wrong</p>
</div>
```

---

## 📝 Best Practices

### DO ✅

```tsx
// Use tokens for consistency
import { badges, gap, semantic } from '@/shared/tokens';
<Badge className={badges.status.connected}>

// Combine tokens with cn() for custom styling
import { cards } from '@/shared/tokens';
import { cn } from '@/shared/lib/utils';
<Card className={cn(cards.interactive, 'max-w-md')}>

// Use semantic colors for theme compatibility
<span className={semantic.success.text}>
```

### DON'T ❌

```tsx
// Don't hardcode raw Tailwind colors
<Badge className="bg-green-500 text-green-700">  // ❌ ESLint error

// Don't use non-4px spacing
<div className="gap-3">  // ❌ ESLint error

// Don't mix tokens with raw patterns
<Badge className={cn(badges.status.connected, 'bg-red-500')}>  // ❌ Conflicts
```

---

## 🔍 Finding Tokens

**In VS Code:**
1. Import from `@/shared/tokens`
2. Start typing and autocomplete will show available tokens
3. Hover over tokens to see their Tailwind class values

**In Storybook:**
- Visit http://localhost:6006
- Navigate to "Design System / Tokens Usage"
- See live examples of all token patterns

**In Code:**
- `frontend/src/shared/tokens/colors.ts`
- `frontend/src/shared/tokens/spacing.ts`
- `frontend/src/shared/tokens/patterns.ts`

---

## 🎨 Adding New Tokens

### Step 1: Update CSS Variables

```css
/* frontend/src/index.css */
:root {
  --my-new-color: 200 80% 50%;
}
```

### Step 2: Add to Tailwind Config

```js
// frontend/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        myNew: 'hsl(var(--my-new-color))',
      },
    },
  },
};
```

### Step 3: Add Token

```ts
// frontend/src/shared/tokens/colors.ts
export const myCategory = {
  newColor: {
    bg: 'bg-myNew',
    text: 'text-myNew',
    border: 'border-myNew',
  },
} as const;
```

### Step 4: Export

```ts
// frontend/src/shared/tokens/index.ts
export { myCategory } from './colors';
```

---

## 📚 Related Documentation

- [Design System Overview](../../../../docs/design-system/README.md)
- [Color System](../../../../docs/design-system/01-colors.md)
- [Spacing System](../../../../docs/design-system/02-spacing.md)
- [Component Patterns](../../../../docs/design-system/05-components/)
- [CLAUDE.md Frontend Guidelines](../../../../CLAUDE.md#frontend-design-system)

---

## 🐛 Troubleshooting

**Autocomplete not working?**
- Check TypeScript server is running
- Verify `@/shared/tokens` alias in `tsconfig.json`
- Restart VS Code

**ESLint errors on tokens?**
- Tokens are ESLint-safe (no raw colors)
- If getting errors, check you're importing from `@/shared/tokens`

**Token values not updating?**
- Changes to CSS variables require page refresh
- Changes to token files are hot-reloaded

---

**Version:** 1.0.0
**Last Updated:** 2025-12-05
