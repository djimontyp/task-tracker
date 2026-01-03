# Components

## Card Hover Pattern

Interactive cards use the project's glow shadow system for visual feedback.

### Standard: Glow Shadows

| State | Class | Effect |
|-------|-------|--------|
| **Base** | `shadow-glow` | Subtle ambient glow |
| **Hover** | `hover:shadow-glow-hover` | Enhanced glow on hover |
| **Small** | `shadow-glow-sm` | Minimal glow (featured items) |
| **Large** | `shadow-glow-lg` | Prominent glow (hero cards) |

### Interactive Card Pattern

For cards with click handlers, use the `.card-interactive` component class:

```tsx
<Card
  className="card-interactive"
  onClick={() => navigate(`/items/${item.id}`)}
>
  {/* Card content */}
</Card>
```

This class applies:
- `shadow-glow` - Base ambient glow
- `hover:shadow-glow-hover` - Enhanced glow on hover
- `transition-all duration-300` - Smooth animation
- `cursor-pointer` - Visual click affordance

### Featured Items (High Confidence)

For items that should stand out (e.g., high-confidence atoms):

```tsx
const glowClass = isFeatured
  ? 'shadow-glow-sm hover:shadow-glow-hover'  // Always visible, stronger on hover
  : 'hover:shadow-glow-sm'                     // Only visible on hover

<Card className={cn('transition-all duration-300', glowClass, onClick && 'cursor-pointer')}>
  {/* Content */}
</Card>
```

### Non-Interactive Cards

Read-only cards (display only, no click action) should not have hover effects:

```tsx
<Card className="p-4">
  {/* Static content */}
</Card>
```

### Button Shadows

Buttons use standard Tailwind shadows (not glow):

```tsx
<Button
  className="shadow-md hover:shadow-lg transition-all"
>
  Primary Action
</Button>
```

## Shadow System Reference

Defined in `tailwind.config.js`:

| Token | Purpose |
|-------|---------|
| `shadow-glow` | Subtle permanent glow (cards at rest) |
| `shadow-glow-hover` | Stronger hover glow |
| `shadow-glow-sm` | Small subtle glow (badges, featured items) |
| `shadow-glow-lg` | Large prominent glow (hero sections) |
| `shadow-md` | Standard Tailwind shadow (buttons) |
| `shadow-lg` | Elevated Tailwind shadow (button hover) |

## Motion

All shadow transitions should use:
- `transition-all duration-300` for smooth animation
- Respect `prefers-reduced-motion` via `motion-reduce:transition-none`

---

## Related Files

- `frontend/src/index.css` - Component classes (`.card-interactive`)
- `frontend/tailwind.config.js` - Shadow token definitions
- `docs/design-system/07-motion.md` - Animation guidelines
