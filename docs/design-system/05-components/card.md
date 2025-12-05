# Card Component

## Purpose

Display grouped content in a contained, elevated container. Cards organize information hierarchically and create visual separation.

## Variants

| Variant | Shadow | Border | Background | Use |
|---------|--------|--------|------------|-----|
| **default** | Subtle (elevation-1) | None | Background | Main content container |
| **outlined** | None | Border | Background | Secondary container |
| **elevated** | Strong (elevation-2) | None | Background | Important content (less common) |

## Sizes

| Size | Padding | Use |
|------|---------|-----|
| **sm** | 8px (p-2) | Sidebar items, dense lists |
| **default** | 16px (p-4) | Standard cards |
| **lg** | 24px (p-6) | Large content blocks |

## States

### Default (Resting)

```jsx
<Card className="p-4">
  <h3 className="font-semibold">Card Title</h3>
  <p className="text-sm text-muted-foreground">Card content</p>
</Card>
```

**Visual:**
- Subtle shadow (elevation-1)
- White background (light mode), dark background (dark mode)
- Border: None
- 16px padding (default)

### Hover (Interactive)

```jsx
<Card className="p-4 hover:shadow-md cursor-pointer transition-shadow">
  Card with hover effect
</Card>
```

**Visual:**
- Shadow increases (elevation-2)
- Slight shadow lift effect
- Cursor: pointer (if clickable)
- Smooth 200ms transition

### Focused (Keyboard Navigation)

```jsx
<Card
  className="p-4 focus-within:ring-2 focus-within:ring-ring"
  tabIndex={0}
>
  <input />
</Card>
```

**Visual:**
- 2px ring outline visible
- Ring color: primary (orange)
- Visible on all backgrounds

### Disabled/Inactive

```jsx
<Card className="p-4 opacity-50 pointer-events-none">
  Inactive card
</Card>
```

**Visual:**
- Opacity: 50%
- Cursor: not-allowed
- No interaction

## Anatomy

```
┌──────────────────────────────┐
│  ↑ Padding (p-4)             │
│  ← Card Content →            │
│                       ↓      │
└──────────────────────────────┘
         ↑
    Shadow (optional)
```

**Structure:**
- `<div>` wrapper with background + shadow
- Responsive padding (p-2 mobile → p-4 desktop)
- Nested content: `space-y-*` for vertical rhythm
- Optional border/elevation variants

## Usage Examples

### Simple Content Card

```jsx
<Card className="p-4">
  <h3 className="font-semibold mb-2">Topics Overview</h3>
  <p className="text-sm text-muted-foreground">
    You have 5 active topics with 23 atoms.
  </p>
</Card>
```

### Atom Card (with badge + actions)

```jsx
<Card className="p-4 space-y-3 hover:shadow-md transition-shadow">
  <div className="flex items-start justify-between gap-2">
    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-atom-problem text-white">
      PROBLEM
    </span>
    <span className="text-xs text-muted-foreground">45%</span>
  </div>

  <div>
    <h3 className="font-semibold text-base mb-1 line-clamp-2">
      Atom Title
    </h3>
    <p className="text-sm text-muted-foreground line-clamp-3">
      Atom description goes here...
    </p>
  </div>

  <Button size="sm" variant="ghost" className="text-xs">
    View Details
  </Button>
</Card>
```

### Message Card (with metadata)

```jsx
<Card className="p-4 space-y-3">
  <div className="flex items-start justify-between gap-2">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">
        From: @user_handle
      </p>
      <p className="text-xs text-muted-foreground">
        2 hours ago in #general
      </p>
    </div>
    <span className="h-2 w-2 rounded-full bg-status-pending flex-shrink-0 mt-1" />
  </div>

  <p className="text-sm line-clamp-3">
    Message content preview...
  </p>

  <div className="flex gap-1 text-xs text-muted-foreground">
    <Badge variant="outline">SIGNAL</Badge>
    <Badge variant="outline">Importance: 0.82</Badge>
  </div>
</Card>
```

### Card Grid Layout

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} className="p-4 hover:shadow-md cursor-pointer transition-shadow">
      <h3 className="font-semibold">{item.title}</h3>
      <p className="text-sm text-muted-foreground">{item.description}</p>
    </Card>
  ))}
</div>
```

### Card with Header/Footer

```jsx
<Card>
  <div className="border-b p-4">
    {/* Card header */}
    <h2 className="font-semibold">Card Title</h2>
  </div>

  <div className="p-4 space-y-4">
    {/* Card body */}
    <p>Content goes here</p>
  </div>

  <div className="border-t p-4 bg-muted/50 flex gap-2 justify-end">
    {/* Card footer */}
    <Button variant="outline" size="sm">Cancel</Button>
    <Button size="sm">Save</Button>
  </div>
</Card>
```

### List of Cards

```jsx
<div className="space-y-2">
  {/* 8px gap between cards */}
  {items.map(item => (
    <Card key={item.id} className="p-3 hover:bg-accent transition-colors">
      <div className="flex items-center justify-between">
        <span className="font-medium">{item.name}</span>
        <span className="text-xs text-muted-foreground">{item.status}</span>
      </div>
    </Card>
  ))}
</div>
```

## Shadow/Elevation System

### Shadow Levels

```css
/* index.css */
--elevation-0: 0 0 0 0 rgba(0,0,0,0);
--elevation-1: 0 1px 3px 0 rgba(0,0,0,0.1);      /* Default cards */
--elevation-2: 0 4px 6px -1px rgba(0,0,0,0.1);   /* Hover cards */
--elevation-3: 0 10px 15px -3px rgba(0,0,0,0.1); /* Elevated cards */
--elevation-4: 0 20px 25px -5px rgba(0,0,0,0.1); /* Modals */
```

### Using Shadows

```jsx
// Default card (elevation-1)
<Card className="shadow-sm">
  Content
</Card>

// Hovered card (elevation-2)
<Card className="hover:shadow-md transition-shadow">
  Interactive card
</Card>

// Elevated section (elevation-3)
<Card className="shadow-lg">
  Important content
</Card>

// Modal (elevation-4)
<Dialog>
  <DialogContent className="shadow-2xl">
    Modal content
  </DialogContent>
</Dialog>
```

## Accessibility Requirements

- [ ] **Sufficient color contrast** (WCAG 1.4.3)
  - Text ≥4.5:1 ratio on card background
  - Card border ≥3:1 ratio on page background
- [ ] **Keyboard navigation** (WCAG 2.1.1)
  - Focusable if interactive (hover effect visible)
  - Focus indicator visible (ring or outline)
- [ ] **Text truncation** (if text overflows)
  - Use `line-clamp-*` or `truncate` Tailwind classes
  - Provide full text in tooltip or detail view
- [ ] **No color-only status** (WCAG 1.4.1)
  - If status shown by color, add icon or text

## Do's and Don'ts

### Do's ✅

- **Do** use consistent padding (p-4 for standard)
- **Do** add hover effect for interactive cards
- **Do** use space-y-* for internal spacing
- **Do** nest related content logically
- **Do** truncate long text gracefully
- **Do** provide focus indicator for keyboard users
- **Do** use cards to group related information
- **Do** test shadow visibility in dark mode

### Don'ts ❌

- **Don't** use cards for every element (overuse creates noise)
- **Don't** mix padding sizes without reason (be consistent)
- **Don't** nest cards inside cards (flatten hierarchy)
- **Don't** use multiple shadow levels randomly
- **Don't** add unnecessary animations on hover
- **Don't** ignore focus states (essential for accessibility)
- **Don't** use cards for page layout (use containers/grid)
- **Don't** make cards too tall (vertical scrolling within cards)

## Code Examples

### Semantic Card Structure

```jsx
// Proper semantic structure
export function TopicCard({ topic }) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold flex-1 min-w-0">
            {topic.name}
          </h3>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {topic.count} atoms
          </span>
        </div>

        {/* Metadata */}
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>Created {formatDate(topic.createdAt)}</span>
          <span>•</span>
          <span>{topic.messageCount} messages</span>
        </div>

        {/* Action footer */}
        <Button variant="ghost" size="sm" className="w-full justify-start">
          View topic →
        </Button>
      </div>
    </Card>
  )
}
```

### Interactive Card with Selection

```jsx
export function SelectableCard({ item, selected, onSelect }: Props) {
  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-md",
        selected && "ring-2 ring-primary shadow-md"
      )}
      onClick={() => onSelect(item.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(item.id)
        }
      }}
    >
      <h3 className="font-semibold">{item.name}</h3>
      <p className="text-sm text-muted-foreground">{item.description}</p>
    </Card>
  )
}
```

### Card Loading State

```jsx
export function LoadingCard() {
  return (
    <Card className="p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-8 w-32" />
    </Card>
  )
}
```

## Component API

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  className?: string
}
```

**Note:** Card is a simple wrapper `<div>`. Customize with className prop.

---

## Specification Summary

| Property | Value |
|----------|-------|
| **Component** | `<Card>` |
| **Location** | `frontend/src/shared/ui/card.tsx` |
| **Display** | `block` |
| **Background** | Color from CSS variable (auto light/dark) |
| **Shadow** | elevation-1 (subtle) |
| **Border Radius** | 6px (md) |
| **Padding** | 16px default (p-4) |
| **Responsive** | Adjust padding: p-2 mobile → p-4 desktop |
| **Hover Effect** | shadow-md transition (200ms) |
| **Focus Style** | ring-2 ring-ring (if focusable) |
| **Dark Mode** | Auto via CSS variables |

