# Motion & Animation System

## Principle: Motion Serves Purpose

**Motion is not decoration.** Every animation must:
1. Guide user attention
2. Provide feedback on interaction
3. Clarify state change
4. Enhance perceived performance

**Always respect `prefers-reduced-motion`** for users with vestibular disorders, epilepsy, or motion sensitivity.

---

## Animation Durations

| Duration | Use | Feel |
|----------|-----|------|
| **50ms** | Hover states, micro-interactions | Instant, responsive |
| **100ms** | Focus states, button presses | Quick feedback |
| **150ms** | State transitions | Noticeable but not slow |
| **200ms** | Dialog enter/exit, modal slides | Comfortable, not jarring |
| **300ms** | Page transitions, major layout changes | Deliberate, clear |
| **500ms+** | Rare (use sparingly) | Loading indicators, progress |

**Pulse Radar defaults: 200ms** for most transitions (dialogs, overlays)

---

## Easing Functions

| Easing | Cubic Bezier | Use | Feel |
|--------|-------------|-----|------|
| **ease-out** | (0.25, 0.46, 0.45, 0.94) | Entrance (scale up) | Bouncy, arrives |
| **ease-in** | (0.42, 0, 1, 1) | Exit (scale down) | Snappy, departs |
| **ease-in-out** | (0.42, 0, 0.58, 1) | Persistent elements | Smooth, symmetric |
| **linear** | (0, 0, 1, 1) | Progress bars, loading | Mechanical, predictable |

**Pulse Radar defaults:**
```css
/* For entrance */
transition: all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);

/* For exit */
transition: all 200ms cubic-bezier(0.42, 0, 1, 1);
```

---

## Defined Animations (Tailwind)

### Fade In (Entrance)

```css
/* tailwind.config.js */
keyframes: {
  "fade-in": {
    "0%": { opacity: "0" },
    "100%": { opacity: "1" }
  }
}

animation: {
  "fade-in": "fade-in 0.3s ease-out"
}
```

**Usage:**
```jsx
<div className="animate-fade-in">
  Content appears
</div>
```

**When to use:** Page load, modal open, dropdown appear

### Fade In Up (Entrance with movement)

```css
keyframes: {
  "fade-in-up": {
    "0%": { opacity: "0", transform: "translateY(10px)" },
    "100%": { opacity: "1", transform: "translateY(0)" }
  }
}

animation: {
  "fade-in-up": "fade-in-up 0.4s ease-out"
}
```

**Usage:**
```jsx
<div className="animate-fade-in-up">
  Toast notification
</div>
```

**When to use:** Toast notifications, popup menus, bottom sheets

---

## Transition Patterns (Tailwind)

### Hover Transition

```jsx
<Card className="hover:shadow-md transition-shadow duration-200">
  Hover this card
</Card>
```

**Properties to transition:**
- `transition-colors` — Color changes (bg, text, border)
- `transition-shadow` — Shadow changes (hover effects)
- `transition-opacity` — Opacity changes (fade in/out)
- `transition-transform` — Scale, rotate (avoid—expensive)
- `transition-all` — All properties (use sparingly)

**Duration:** `duration-200` (200ms, default)

### Focus Transition

```jsx
<input className="focus-visible:ring-2 focus-visible:ring-ring" />
```

**Visual:**
- Ring appears instantly (no transition needed)
- Transition already handled by focus-visible state

### Button Interaction

```jsx
<Button className="transition-colors duration-150">
  Press me
</Button>
```

**States:**
- Default → Hover: 150ms color transition
- Hover → Pressed: Instant (no transition needed)
- Pressed → Default: 150ms color transition

---

## Reduced Motion Fallback

**CRITICAL:** Every animation must have a fallback.

### Global Reduced Motion

```css
/* index.css */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

This makes all animations instant for users with motion sensitivity.

### Component-Level Fallback

```jsx
// Option 1: Use global rule (preferred)
<div className="animate-fade-in">
  {/* Automatically respects prefers-reduced-motion */}
</div>

// Option 2: Custom fallback
<div className={cn(
  "transition-opacity duration-200",
  "motion-reduce:transition-none"  // Instant on reduced motion
)}>
  Content
</div>
```

### Testing Reduced Motion

```bash
# Chrome DevTools
1. F12 → Rendering
2. Scroll to "Emulate CSS media feature prefers-reduced-motion"
3. Select "prefers-reduced-motion: reduce"
4. Refresh page
5. All animations should be instant
```

---

## Animation Examples

### Loading Spinner

```jsx
import { Loader2 } from 'lucide-react'

<Loader2 className="animate-spin" />
```

**CSS:**
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

animation: spin 1s linear infinite;
```

**Reduced motion:** Stops spinning, shows static icon

### Skeleton Loading (Shimmer)

```jsx
<Skeleton className="h-6 w-3/4" />
```

**CSS:**
```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

animation: shimmer 2s infinite;
```

**Reduced motion:** Stops shimmer, shows plain gray box

### Modal Entrance

```jsx
<Dialog open={open}>
  <DialogContent className="animate-fade-in">
    Modal content
  </DialogContent>
</Dialog>
```

**Effect:**
- Backdrop: Fades in (opacity 0 → 1)
- Dialog: Fades and slides up (transform + opacity)
- Duration: 300ms

**Reduced motion:** Appears instantly

### Toast Notification

```jsx
import { toast } from 'sonner'

toast.success('Saved!')
```

**Effect:**
- Enters: Fades in from bottom (200ms, ease-out)
- Stays: 3 seconds
- Exits: Fades out to right (200ms, ease-in)

**Reduced motion:** Appears/disappears instantly

---

## Micro-Interactions

### Hover Button

```jsx
<Button className="hover:bg-primary/90 transition-colors duration-150">
  Hover me
</Button>
```

**Effect:**
- Background: 10% darker
- Duration: 150ms
- Easing: ease-in-out (smooth)

### Focus Ring

```jsx
<input className="focus-visible:outline-3 focus-visible:outline-offset-2" />
```

**Effect:**
- Ring: 3px outline appears instantly
- Color: Primary orange
- Offset: 2px from element

### Card Elevation

```jsx
<Card className="hover:shadow-md transition-shadow duration-200">
  Interactive card
</Card>
```

**Effect:**
- Shadow: elevation-1 → elevation-2
- Duration: 200ms
- Easing: ease-out (arrives)

---

## Anti-Patterns (DON'T DO)

### ❌ Animation Without Purpose

```jsx
// DON'T — spinning logo for decoration
<Logo className="animate-spin" />
```

### ❌ Too Many Animations

```jsx
// DON'T — every element animates
<div className="animate-fade-in">
  <h1 className="animate-slide-down">
    <span className="animate-pulse">Title</span>
  </h1>
</div>
```

### ❌ Long Durations

```jsx
// DON'T — 1 second is too slow for UI
<dialog className="animate-fade-in" style={{ animationDuration: '1s' }}>
```

### ❌ No Reduced Motion Fallback

```jsx
// DON'T — no @media (prefers-reduced-motion: reduce)
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

### ❌ Opacity-Only Transitions

```jsx
// DON'T — state change not clear to users
<div className="opacity-0">Invisible content</div>
```

---

## Tailwind Motion Classes

### Animation Classes

| Class | Duration | Effect |
|-------|----------|--------|
| `animate-spin` | 1s | Rotating spinner |
| `animate-pulse` | 2s | Pulsing opacity |
| `animate-bounce` | 1s | Bouncing (vertical) |
| `animate-fade-in` | 300ms | Fade in (custom) |
| `animate-fade-in-up` | 400ms | Fade in + slide up (custom) |

### Transition Classes

| Class | Property |
|-------|----------|
| `transition` | All properties |
| `transition-colors` | Color changes |
| `transition-shadow` | Shadow changes |
| `transition-opacity` | Opacity changes |
| `transition-transform` | Scale, rotate (expensive) |
| `transition-none` | No transition |

### Duration Classes

| Class | Duration |
|-------|----------|
| `duration-75` | 75ms |
| `duration-100` | 100ms |
| `duration-150` | 150ms |
| `duration-200` | 200ms (default) |
| `duration-300` | 300ms |
| `duration-500` | 500ms |
| `duration-700` | 700ms |
| `duration-1000` | 1s |

### Easing Classes

| Class | Easing |
|-------|--------|
| `ease-linear` | Linear |
| `ease-in` | Slow start |
| `ease-out` | Fast start, slow end |
| `ease-in-out` | Slow start + end |

---

## Implementation Guide

### Step 1: Identify Animation Needs

Ask: "Does this animation serve a purpose?"

| Scenario | Animation | Duration | Easing |
|----------|-----------|----------|--------|
| Modal opens | Fade + slide up | 200ms | ease-out |
| Button pressed | Color change | 150ms | ease-out |
| Loading | Spinner | 1s | linear |
| Page transition | Fade | 300ms | ease-in-out |
| Hover effect | Shadow | 200ms | ease-out |

### Step 2: Apply Animation

```jsx
<dialog className="animate-fade-in duration-200">
  Modal content
</dialog>
```

### Step 3: Add Reduced Motion

```jsx
// Tailwind handles globally via index.css
// OR use motion-reduce class
<div className="animate-spin motion-reduce:animate-none">
  Loading...
</div>
```

### Step 4: Test

```bash
# Enable reduced motion in browser DevTools
# Verify animation is instant
# Tab/Enter navigation works
# Focus indicators visible
```

---

## CSS Custom Animations

For custom animations not in Tailwind:

```jsx
// Define in index.css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Apply via className
<div className="animate-slide-up">
  Content
</div>

// Add to tailwind.config.js
keyframes: {
  slideUp: {
    '0%': { opacity: '0', transform: 'translateY(10px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' }
  }
},
animation: {
  slideUp: 'slideUp 0.3s ease-out'
}
```

### With Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .animate-slide-up {
    animation: none;
  }
}
```

---

## Performance Considerations

### Optimize Animations

❌ **Expensive (avoid):**
- `transform: scale()` (repaint + reflow)
- `width`, `height` changes (reflow)
- `left`, `top` positioning (reflow)
- `box-shadow` (expensive to paint)

✅ **Efficient (preferred):**
- `opacity` (paint only, no reflow)
- `transform` with GPU acceleration
- `transition-timing-function` adjustments

### Use Will-Change (Sparingly)

```jsx
<div className="will-change-transform animate-slide-up">
  {/* Hints browser to optimize */}
</div>
```

---

## Animation Checklist

- [ ] Every animation serves a purpose (guides attention, provides feedback)
- [ ] Duration: 200ms (default), max 300ms
- [ ] Easing: ease-out (entrance), ease-in (exit)
- [ ] Reduced motion: All animations have fallback
- [ ] Performance: No layout reflows, use transform/opacity
- [ ] Tested: Works on all browsers (Chrome, Firefox, Safari)
- [ ] Accessible: Focus indicators visible, keyboard works
- [ ] Tested: Reduced motion enabled → instant animations

---

## Summary Table

| Animation | Duration | Easing | Effect | Reduced Motion |
|-----------|----------|--------|--------|-----------------|
| Modal enter | 200ms | ease-out | Fade + slide up | Instant appear |
| Modal exit | 200ms | ease-in | Fade + slide down | Instant disappear |
| Hover button | 150ms | ease-out | Color change | Instant change |
| Loading spinner | 1s | linear | Rotate 360° | Static icon |
| Skeleton shimmer | 2s | linear | Wave shine | Static gray |
| Toast enter | 200ms | ease-out | Fade + slide up | Instant appear |
| Toast exit | 200ms | ease-in | Fade + slide right | Instant disappear |

