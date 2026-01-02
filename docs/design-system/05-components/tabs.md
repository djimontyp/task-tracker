# Tabs

Accessible tab navigation component with two variants for different use cases.

## Variants

### Underline (Default)
Minimalist tabs with animated teal underline indicator. **Best for navigation** between content sections.

```tsx
<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="sources">Sources</TabsTrigger>
    <TabsTrigger value="providers">Providers</TabsTrigger>
  </TabsList>
  <TabsContent value="general">...</TabsContent>
</Tabs>
```

**Visual:**
```
General      Sources      Providers
────────
   ↑ animated teal underline (200ms ease-out)
```

### Pill
Compact tabs with muted background. **Best for filters and toggles**.

```tsx
<Tabs defaultValue="all">
  <TabsList variant="pill">
    <TabsTrigger variant="pill" value="all">All</TabsTrigger>
    <TabsTrigger variant="pill" value="signals">Signals</TabsTrigger>
    <TabsTrigger variant="pill" value="noise">Noise</TabsTrigger>
  </TabsList>
</Tabs>
```

**Visual:**
```
┌─────────────────────────────────┐
│ [▓▓All▓▓] │ Signals │ Noise    │
└─────────────────────────────────┘
   ↑ white background + shadow on active
```

## When to Use Which

| Use Case | Variant |
|----------|---------|
| Page navigation (Settings, Profile) | `default` (underline) |
| Section navigation (modal tabs) | `default` (underline) |
| Filter controls (All/Signals/Noise) | `pill` |
| Toggle selection (Week/Month) | `pill` |
| Form mode switcher | `pill` |

## Design Specifications

### Underline Variant
| Property | Value |
|----------|-------|
| Indicator color | `primary-bright` (teal 50%) |
| Indicator height | `2px` (h-0.5) |
| Animation | `width 200ms ease-out` (left-to-right) |
| Active text | `text-primary-bright` |
| Inactive text | `text-muted-foreground/70` |
| Hover text | `text-muted-foreground` |
| Bottom border | `border-border` |

### Pill Variant
| Property | Value |
|----------|-------|
| Container bg | `bg-muted` |
| Container padding | `p-1` (4px) |
| Active bg | `bg-background` |
| Active shadow | `shadow-sm` |
| Trigger padding | `px-3 py-1.5` |
| Border radius | `rounded-md` |

## Accessibility

- **Keyboard navigation**: Arrow keys move between tabs
- **ARIA roles**: Automatic via Radix UI
- **Focus visible**: Ring offset follows design system
- **Disabled state**: `opacity-50`, pointer-events none

## Animation Details

The underline indicator animates width from left to right:

```css
/* Inactive */
after:w-0

/* Active */
data-[state=active]:after:w-full

/* Transition */
after:transition-all after:duration-200 after:ease-out
```

This creates a smooth "grow from left" effect that follows reading direction.

## Examples

### Settings Navigation
```tsx
// Uses default underline - content navigation
<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="sources">Sources</TabsTrigger>
    <TabsTrigger value="providers">Providers</TabsTrigger>
  </TabsList>
  ...
</Tabs>
```

### Message Filters
```tsx
// Uses pill - filtering data
<TabsList variant="pill">
  <TabsTrigger variant="pill" value="all" className="gap-2">
    All <Badge>128</Badge>
  </TabsTrigger>
  <TabsTrigger variant="pill" value="signals" className="gap-2">
    <Signal className="h-4 w-4" />
    Signals
  </TabsTrigger>
</TabsList>
```

### Full-Width Grid
```tsx
// Pill variant stretched across container
<TabsList variant="pill" className="grid w-full grid-cols-2">
  <TabsTrigger variant="pill" value="period">By Period</TabsTrigger>
  <TabsTrigger variant="pill" value="messages">By Messages</TabsTrigger>
</TabsList>
```

## Import

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
```

## Props

### TabsList
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'pill'` | `'default'` | Visual style variant |
| `className` | `string` | - | Additional CSS classes |

### TabsTrigger
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'pill'` | `'default'` | Must match TabsList variant |
| `value` | `string` | required | Tab identifier |
| `disabled` | `boolean` | `false` | Disable interaction |
| `className` | `string` | - | Additional CSS classes |

## Storybook

View all variants and interactive examples:
- **Primitives/Tabs** in Storybook (http://localhost:6006)
