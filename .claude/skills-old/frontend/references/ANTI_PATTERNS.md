# Frontend Anti-Patterns

> What NOT to do in Pulse Radar frontend.

## Visual Anti-Patterns

### ❌ Hardcoded Tailwind Colors

```tsx
// ❌ WRONG — breaks dark mode, not semantic
<Badge className="bg-rose-500">Problem</Badge>
<span className="text-green-500">Connected</span>
<div className="bg-blue-100">Info box</div>

// ✅ CORRECT — semantic tokens
<Badge className="bg-atom-problem">Problem</Badge>
<span className="text-status-connected">Connected</span>
<div className="bg-muted">Info box</div>
```

**Why:** Hardcoded colors don't adapt to dark mode and lack semantic meaning.

### ❌ Color-Only Indicators

```tsx
// ❌ WRONG — fails WCAG 1.4.1 (Use of Color)
<span className="h-2 w-2 rounded-full bg-green-500" />

// ✅ CORRECT — icon + text
<span className="flex items-center gap-2">
  <CheckCircle className="h-4 w-4 text-status-connected" />
  <span>Connected</span>
</span>
```

**Why:** Colorblind users cannot distinguish status.

### ❌ Gradients

```tsx
// ❌ WRONG — against minimalist brand
<div className="bg-gradient-to-r from-primary to-accent">
<button className="bg-gradient-to-b from-orange-500 to-orange-600">

// ✅ CORRECT — solid colors
<div className="bg-primary">
<button className="bg-primary">
```

**Why:** Pulse Radar uses flat, minimal design.

### ❌ Small Touch Targets

```tsx
// ❌ WRONG — 36px < 44px minimum (WCAG 2.5.5)
<Button size="icon" className="h-9 w-9">
<button className="h-8 w-8">
<IconButton size="sm">

// ✅ CORRECT — 44px minimum
<Button size="icon" className="h-11 w-11">
<button className="min-h-11 min-w-11">
```

**Why:** Mobile users and users with motor impairments need larger targets.

### ❌ Off-Grid Spacing

```tsx
// ❌ WRONG — not on 4px grid
<div className="gap-1.5">   // 6px
<div className="gap-2.5">   // 10px
<div className="p-2.5">     // 10px
<div className="space-y-3.5"> // 14px

// ✅ CORRECT — 4px grid
<div className="gap-2">     // 8px
<div className="gap-3">     // 12px
<div className="p-4">       // 16px
<div className="space-y-4"> // 16px
```

**Why:** Consistent spacing creates visual harmony.

---

## Technical Anti-Patterns

### ❌ Removing Focus Indicators

```css
/* ❌ WRONG — breaks keyboard navigation */
button:focus {
  outline: none;
}

*:focus {
  outline: none;
}
```

```tsx
// ❌ WRONG — focus:outline-none
<button className="focus:outline-none">
```

**Why:** Keyboard users need visible focus indicators (WCAG 2.4.7).

### ❌ Inline Styles

```tsx
// ❌ WRONG — bypasses design system
<div style={{ backgroundColor: '#FF6B35' }}>
<span style={{ color: 'green' }}>

// ✅ CORRECT — Tailwind classes
<div className="bg-primary">
<span className="text-status-connected">
```

**Why:** Inline styles don't respond to theme changes.

### ❌ !important Overrides

```css
/* ❌ WRONG — specificity war */
.my-button {
  background-color: orange !important;
}
```

**Why:** Fix specificity properly, don't force it.

### ❌ Missing ARIA Labels

```tsx
// ❌ WRONG — no accessible name
<Button size="icon"><Trash /></Button>
<button><X /></button>
<IconButton><Settings /></IconButton>

// ✅ CORRECT — aria-label provided
<Button size="icon" aria-label="Delete item"><Trash /></Button>
<button aria-label="Close"><X /></button>
<IconButton aria-label="Settings"><Settings /></IconButton>
```

**Why:** Screen readers need text to announce button purpose.

### ❌ Wrong Icon Library

```tsx
// ❌ WRONG — not Lucide
import { TrashIcon } from '@heroicons/react/24/outline'
import { Cross1Icon } from '@radix-ui/react-icons'

// ✅ CORRECT — Lucide only
import { Trash, X } from 'lucide-react'
```

**Why:** Consistency. Lucide is the project standard.

### ❌ Custom Button Variants

```tsx
// ❌ WRONG — modifying shadcn variants
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        // Don't add custom variants here
        branded: "bg-gradient-to-r from-orange-500...",
        glow: "shadow-lg shadow-primary/50...",
      }
    }
  }
)

// ✅ CORRECT — use existing variants + className
<Button variant="default" className="w-full">Submit</Button>
```

**Why:** Keep shadcn variants standard for consistency.

---

## Layout Anti-Patterns

### ❌ Centered Hero Layouts

```tsx
// ❌ WRONG — generic landing page style
<div className="flex flex-col items-center justify-center min-h-screen text-center">
  <h1 className="text-5xl font-bold">Welcome</h1>
  <p className="text-xl text-muted-foreground">Get started today</p>
</div>
```

**Why:** Pulse Radar is data-focused, not marketing-focused.

### ❌ Purple/Blue Gradients

```tsx
// ❌ WRONG — "AI slop" aesthetic
<div className="bg-gradient-to-r from-purple-600 to-blue-500">
<div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
```

**Why:** Overused in AI products, lacks distinctiveness.

### ❌ Hover-Only Information

```tsx
// ❌ WRONG — info hidden until hover
<div className="group">
  <span>Item</span>
  <span className="hidden group-hover:block">Important info</span>
</div>

// ✅ CORRECT — info always visible
<div>
  <span>Item</span>
  <span className="text-muted-foreground">Important info</span>
</div>
```

**Why:** Mobile has no hover. Important info should be visible.

---

## Animation Anti-Patterns

### ❌ Missing Reduced Motion

```tsx
// ❌ WRONG — no fallback for motion sensitivity
<div className="animate-bounce">
<Loader2 className="animate-spin" />

// ✅ CORRECT — motion-reduce fallback
<div className="animate-bounce motion-reduce:animate-none">
<Loader2 className="animate-spin motion-reduce:animate-none" />
```

**Why:** Some users have vestibular disorders or motion sensitivity.

### ❌ Slow Animations

```css
/* ❌ WRONG — too slow */
.my-element {
  transition: all 500ms;
}

/* ✅ CORRECT — snappy */
.my-element {
  transition: colors 150ms ease-out;
}
```

**Why:** Slow animations feel sluggish.

---

## Checklist Before Committing

- [ ] No hardcoded Tailwind colors (`bg-rose-*`, `bg-green-*`, etc.)
- [ ] Touch targets ≥ 44px
- [ ] Status indicators have icons, not just colors
- [ ] ARIA labels on all icon buttons
- [ ] Spacing uses 4px grid
- [ ] Animations have `motion-reduce:` fallback
- [ ] No `focus:outline-none`
- [ ] Using Lucide icons only
- [ ] No inline styles
