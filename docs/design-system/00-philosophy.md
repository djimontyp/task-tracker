# Design Philosophy

> Pulse Radar: AI knowledge aggregation from Telegram/Slack. 100+ messages/day → actionable insights.

## Aesthetic: Minimalist + Data-Focused

- **Clarity over cleverness** — data shines, UI disappears
- **Whitespace guides** — spacing creates hierarchy, not colors
- **Progressive disclosure** — hide complexity until needed

## 5 Core Principles

### 1. Hierarchy Through Space
Use spacing/sizing before color. Color reinforces, doesn't drive.

### 2. Show, Don't Hide
States visible by default. No hover-only info. Errors above fold.

### 3. One Pattern, Many Contexts
Button/Card/Badge patterns apply everywhere. Extend, don't duplicate.

### 4. Accessibility First
WCAG 2.1 AA baseline. 44px touch, 3px focus ring, 4.5:1 contrast.

### 5. Reduced Motion Always
All animations have `prefers-reduced-motion` fallback.

---

## Anti-Patterns (FORBIDDEN)

### Visual

```tsx
// ❌ Gradients
<div className="bg-gradient-to-r from-primary to-accent">

// ❌ Color-only indicators
<span className="h-2 w-2 rounded-full bg-green-500" />

// ✅ Icon + text
<CheckCircle className="text-status-connected" /> Connected
```

### Technical

```tsx
// ❌ Hardcoded colors
<span className="bg-rose-500">

// ✅ Semantic tokens
<span className="bg-atom-problem">
```

```tsx
// ❌ Small touch targets
<Button size="icon" className="h-6 w-6">

// ✅ WCAG compliant
<Button size="icon" className="h-11 w-11">
```

```tsx
// ❌ Off-grid spacing
<div className="gap-1.5 gap-2.5">

// ✅ 4px grid
<div className="gap-2 gap-4">
```

```tsx
// ❌ No ARIA label
<Button size="icon"><Trash /></Button>

// ✅ Accessible
<Button size="icon" aria-label="Delete"><Trash /></Button>
```

### Layout

```tsx
// ❌ Removing focus
button:focus { outline: none; }

// ✅ Keep default or enhance
// (shadcn has focus built-in)
```

---

## WCAG 2.1 AA Requirements

| Requirement | Value | Check |
|-------------|-------|-------|
| Text contrast | ≥4.5:1 | Use semantic tokens |
| UI contrast | ≥3:1 | Focus rings visible |
| Touch targets | ≥44×44px | `h-11 w-11` |
| Focus indicators | 3px ring, 2px offset | Built into shadcn |
| Reduced motion | Fallback required | `motion-reduce:` |

---

## Design Tokens Summary

| Category | Source | Usage |
|----------|--------|-------|
| Colors | `index.css` vars | `bg-atom-*`, `text-status-*` |
| Spacing | 4px grid | `gap-2`, `p-4` |
| Typography | Tailwind scale | `text-sm`, `text-lg` |
| Shadows | `shadow-card` | Cards only |
| Radius | `--radius` var | `rounded-md` |

---

**Next:** [01-colors.md](./01-colors.md) for full color reference.
