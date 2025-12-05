# Spacing System: Pulse Radar

## Core Principle: 4px Grid

**All spacing is derived from 4px base unit.** This ensures:
- Consistent rhythm across the interface
- Easier responsive scaling
- Mathematical predictability
- Reduced decision fatigue

```
1 unit = 4px
```

---

## Spacing Scale

| Scale | Pixels | Tailwind | Use |
|-------|--------|----------|-----|
| **0** | 0px | `p-0`, `gap-0` | Remove spacing (rare) |
| **1** | 4px | `p-1`, `gap-1` | Minimal spacing (rarely used) |
| **2** | 8px | `p-2`, `gap-2` | Standard gaps, small padding |
| **3** | 12px | `p-3`, `gap-3` | Compact spacing (avoid—between 2 and 4) |
| **4** | 16px | `p-4`, `gap-4` | Standard padding, default gaps |
| **5** | 20px | `p-5`, `gap-5` | Generous spacing (rare) |
| **6** | 24px | `p-6`, `gap-6` | Large spacing, section separators |
| **8** | 32px | `p-8` | Extra large spacing |
| **12** | 48px | `p-12` | Very large spacing (rare) |

**Preferred Values (use most):**
- 4px (gap-1, tight spacing)
- 8px (gap-2, standard)
- 12px (gap-3, only for special cases)
- 16px (gap-4, default)
- 24px (gap-6, sections)

**Avoid (mathematical, but breaks rhythm):**
- gap-1.5 (6px) ← Non-standard
- gap-2.5 (10px) ← Non-standard
- gap-3.5 (14px) ← Non-standard

---

## Padding (Internal Spacing)

Padding is the space **inside** a component (button, card, input).

### Button Padding

| Size | Height | Horizontal | Vertical | Use |
|------|--------|------------|----------|-----|
| **icon** | 44px | 0 | 0 | Icon-only buttons (44×44px) |
| **sm** | 32px | 12px (p-3) | 4px | Small buttons |
| **default** | 36px | 16px (p-4) | 8px | Standard buttons |
| **lg** | 40px | 32px | 8px | Large buttons (wide) |

```jsx
// Button padding examples
<Button size="sm" className="h-8 px-3">Small</Button>
<Button size="default" className="h-9 px-4">Standard</Button>
<Button size="lg" className="h-10 px-8">Large</Button>
<Button size="icon" className="h-11 w-11">→</Button>
```

### Card Padding

Cards have consistent internal padding:

```jsx
// Standard card
<Card className="p-4">
  {/* 16px padding on all sides */}
</Card>

// Dense card (sidebar items)
<Card className="p-2">
  {/* 8px padding on all sides */}
</Card>

// Spacious card (hero section)
<Card className="p-6">
  {/* 24px padding on all sides */}
</Card>
```

### Input Field Padding

```jsx
// Text input
<input className="h-9 px-3 py-2" />
// Height: 36px, Horizontal padding: 12px, Vertical padding: 8px

// Large input (textarea)
<textarea className="p-3" />
// Padding: 12px on all sides
```

### Form Field Structure

```jsx
<div className="space-y-2">
  {/* 8px gap between label and input */}
  <label className="text-sm font-medium">Label</label>
  <input className="h-9 px-3 py-2" />
  <span className="text-xs text-muted-foreground">
    Helper text (optional)
  </span>
</div>
```

---

## Gap (Space Between Elements)

Gap is the space **between** adjacent elements (between list items, flex children).

### Container Gaps

```jsx
// Horizontal gap (left-right spacing)
<div className="flex gap-2">
  {/* 8px gap between items */}
</div>

<div className="flex gap-4">
  {/* 16px gap between items */}
</div>

// Vertical gap (top-bottom spacing)
<div className="flex flex-col space-y-2">
  {/* 8px gap between rows */}
</div>

<div className="flex flex-col space-y-4">
  {/* 16px gap between rows */}
</div>
```

### Grid Gaps

```jsx
// Equal horizontal + vertical spacing
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
  {/* 16px gap on all sides */}
</div>

// Different horizontal/vertical
<div className="grid gap-x-2 gap-y-4">
  {/* 8px horizontal, 16px vertical */}
</div>
```

### List Gaps

```jsx
// Standard list spacing
<ul className="space-y-4">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
// 16px between items

// Compact list
<ul className="space-y-2">
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
// 8px between items
```

---

## Margin (Outer Spacing)

Margin creates space **outside** a component, affecting siblings.

### Common Margins

```jsx
// Bottom margin (most common)
<h2 className="text-xl font-bold mb-4">
  Section Title
</h2>
// 16px space below heading

// Top margin (less common, use gap instead)
<div className="mt-6">
  {/* 24px space above */}
</div>

// Negative margins (pull up adjacent elements)
<div className="-mt-2">
  {/* Overlap with previous element slightly */}
</div>
```

### Margin Rules

**Prefer gap/space-y over margins:**
```jsx
// DON'T DO THIS — margins cause stacking problems
<div>
  <h2 className="mb-4">Title</h2>
  <p className="mt-2">Content</p>
</div>

// DO THIS — use flex + gap
<div className="flex flex-col gap-2">
  <h2>Title</h2>
  <p>Content</p>
</div>
```

**Why? Gaps collapse predictably, margins can overlap.**

---

## Responsive Spacing

Spacing adjusts at breakpoints to accommodate screen size.

### Mobile-First Spacing

```jsx
// Mobile: 8px gap, Tablet+: 16px gap
<div className="flex flex-col gap-2 sm:gap-4">
  {/* Items spaced 8px on mobile, 16px on tablet+ */}
</div>

// Mobile: 12px padding, Desktop: 16px padding
<Card className="p-3 sm:p-4">
  {/* Tighter on mobile, relaxed on desktop */}
</Card>

// Mobile: two columns, Desktop: three columns
<div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4">
  {/* 2 cols × 8px gap → 3 cols × 16px gap */}
</div>
```

### Breakpoint Spacing Rules

| Screen Size | Gap | Padding | Margin |
|-----------|-----|---------|--------|
| **Mobile (< 640px)** | gap-2 (8px) | p-2 (8px) | 0 |
| **Tablet (640px+)** | gap-3 (12px) | p-3 (12px) | 0 |
| **Desktop (1024px+)** | gap-4 (16px) | p-4 (16px) | 0 |

```jsx
// Progressive spacing scale
<div className="p-2 sm:p-3 md:p-4 gap-2 sm:gap-3 md:gap-4">
  {/* Tightest on mobile, most spacious on desktop */}
</div>
```

---

## Whitespace as Visual Hierarchy

**More spacing = less important**

```jsx
// Dense section (important content)
<section className="space-y-2 p-4">
  <h3>Critical Section</h3>
  <p>Content items packed tightly</p>
</section>

// Loose section (secondary content)
<section className="space-y-4 p-6">
  <h3>Secondary Section</h3>
  <p>Content with breathing room</p>
</section>
```

### Card Hierarchy by Spacing

```jsx
// Level 1 (primary card — tightest)
<Card className="p-3 space-y-2">
  {/* Important content, dense layout */}
</Card>

// Level 2 (secondary card)
<Card className="p-4 space-y-3">
  {/* Standard spacing */}
</Card>

// Level 3 (tertiary card — loosest)
<Card className="p-6 space-y-4">
  {/* Secondary info, loose layout */}
</Card>
```

---

## Common Spacing Patterns

### Form Layout

```jsx
<form className="space-y-4 p-4">
  {/* 16px gap between form rows */}
  <div className="space-y-2">
    {/* 8px gap between label and input */}
    <label>Email</label>
    <input className="h-9 px-3" />
    <span className="text-xs text-muted-foreground">
      Enter your email address
    </span>
  </div>

  <button className="px-4 py-2">Submit</button>
</form>
```

### Card Layout (Sidebar Item)

```jsx
<div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
  {/* 8px gap between icon and text */}
  <Icon className="h-4 w-4 flex-shrink-0" />
  <span className="text-sm font-medium">Menu Item</span>
  <ChevronRight className="h-4 w-4 ml-auto" />
  {/* ml-auto pushes chevron right */}
</div>
```

### List of Cards

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 16px gaps (horizontal + vertical) */}
  {items.map(item => (
    <Card key={item.id} className="p-4 space-y-3">
      {/* Content inside cards */}
    </Card>
  ))}
</div>
```

### Modal/Dialog

```jsx
<DialogContent className="p-6">
  {/* 24px padding inside modal */}
  <DialogHeader className="space-y-2">
    {/* 8px between title and description */}
    <DialogTitle>Confirm Action</DialogTitle>
    <DialogDescription>Are you sure?</DialogDescription>
  </DialogHeader>

  <div className="space-y-4 py-4">
    {/* Modal body with 16px gaps */}
  </div>

  <DialogFooter className="space-x-2">
    {/* 8px between buttons */}
  </DialogFooter>
</DialogContent>
```

### Header/Navbar

```jsx
<header className="h-14 px-4 sm:px-6 border-b">
  {/* 16px horizontal padding (mobile), 24px (desktop) */}
  <div className="flex items-center justify-between h-full gap-4">
    {/* 16px gap between logo, nav, actions */}
    <Logo />
    <nav className="flex gap-1">
      {/* 4px gap between nav items (compact) */}
    </nav>
    <div className="flex gap-2">
      {/* 8px gap between action buttons */}
    </div>
  </div>
</header>
```

---

## Spacing Edge Cases

### Negative Spacing (Overlaps)

```jsx
// Pull up elements for visual density
<div className="-mt-2">
  {/* Overlaps with previous element */}
</div>

// Use sparingly—prefer gap adjustment instead
```

### Zero Spacing (Remove space)

```jsx
// Adjacent elements with no gap
<div className="flex gap-0">
  {/* No space between items */}
</div>

// Remove margin
<div className="m-0">
  {/* No margin */}
</div>
```

### Auto Spacing (Flex spacer)

```jsx
// Push element to right
<div className="flex items-center">
  <span>Left</span>
  <div className="ml-auto" />
  <span>Right</span>
</div>

// Or use justify-between
<div className="flex justify-between">
  <span>Left</span>
  <span>Right</span>
</div>
```

---

## Touch Target Spacing

**WCAG Rule:** 44×44px minimum touch targets with ≥8px spacing between them.

```jsx
// Icon button (44×44px)
<Button
  size="icon"
  className="h-11 w-11"
  aria-label="Delete"
>
  <Trash className="h-5 w-5" />
</Button>

// Multiple buttons with proper spacing
<div className="flex gap-2">
  {/* 8px gap between 44×44px buttons */}
  <Button size="icon" className="h-11 w-11">A</Button>
  <Button size="icon" className="h-11 w-11">B</Button>
</div>
// Result: 44px button + 8px gap + 44px button = safe to tap
```

---

## Spacing Checklist

- [ ] All gaps use 4px increments (4, 8, 12, 16, 24)
- [ ] No arbitrary values (no gap-1.5, gap-2.5)
- [ ] Cards padded consistently (p-4 for standard)
- [ ] Buttons sized for 44×44px minimum (mobile)
- [ ] Form fields have 8px gap between label and input
- [ ] List items spaced with gap-2 (8px) or gap-4 (16px)
- [ ] Responsive scaling defined (mobile → tablet → desktop)
- [ ] Touch targets ≥44×44px with ≥8px gap
- [ ] No margin-based layouts (prefer gap)
- [ ] Whitespace creates visual hierarchy

---

## Summary Table

| Element | Padding | Gap | Margin |
|---------|---------|-----|--------|
| **Button (default)** | `px-4 py-2` | — | `m-0` |
| **Button (sm)** | `px-3` | — | `m-0` |
| **Card** | `p-4` | `space-y-4` | `m-0` |
| **Form field** | `px-3 py-2` | (label gap-2) | `m-0` |
| **List item** | `px-2 py-1` | `space-y-2` | `m-0` |
| **Header** | `px-4 sm:px-6` | `gap-4` | `m-0` |
| **Section** | — | `space-y-6` | `m-0` |
| **Modal** | `p-6` | `space-y-4` | — |

