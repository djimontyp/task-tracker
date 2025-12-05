---
name: frontend
description: >
  Create distinctive, production-grade React interfaces using shadcn/ui.
  Triggers on frontend tasks, UI components, styling. Combines technical
  shadcn patterns with intentional design thinking for memorable aesthetics.
---

# Frontend Development Skill

> **Pulse Radar Brand:** Data-Focused Minimalism — clarity over cleverness, data shines, UI disappears.

## Quick Reference

| Need | Resource |
|------|----------|
| Color tokens | [01-colors.md](../../../docs/design-system/01-colors.md) |
| Spacing grid | [03-spacing.md](../../../docs/design-system/03-spacing.md) |
| WCAG rules | [08-accessibility.md](../../../docs/design-system/08-accessibility.md) |
| AI coding rules | [frontend/AGENTS.md](../../../frontend/AGENTS.md) |
| Full Design System | [docs/design-system/README.md](../../../docs/design-system/README.md) |

---

## Part 1: Technical Foundation (shadcn/ui)

### Component Locations

| Type | Path |
|------|------|
| shadcn/ui primitives | `frontend/src/shared/ui/` |
| Custom components | `frontend/src/shared/components/` |
| Pages | `frontend/src/pages/` |
| Config | `frontend/components.json` |

### Imports

```tsx
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { DataTable } from '@/shared/components/DataTable'
import { cn } from '@/shared/lib'
import { Trash, Check, AlertCircle } from 'lucide-react'
```

### Installed shadcn Components (33)

alert-dialog, alert, avatar, badge, breadcrumb, button, card, chart,
checkbox, collapsible, command, dialog, dropdown-menu, input, label,
notification-badge, pagination, popover, progress, radio-group, select,
separator, sheet, sidebar, skeleton, slider, sonner, switch, table,
tabs, textarea, tooltip

### Adding New Components

```bash
cd frontend && npx shadcn add {component}
```

### Documentation Sources

- **Primitives:** `WebFetch → https://ui.shadcn.com/docs/components/{name}`
- **Extended:** `mcp__shadcn__getComponent({ component: "animated-modal" })`

---

## Part 2: Design Thinking (Pulse Radar)

### Brand Direction

| Aspect | Value |
|--------|-------|
| **Tone** | Professional, warm, accessible (not corporate) |
| **Palette** | Orange primary, Navy accent, Semantic status colors |
| **Typography** | System fonts (performance over custom) |
| **Motion** | Subtle, functional (not decorative) |
| **Differentiator** | Activity heatmaps, atom type badges |

### 4 Planning Dimensions

Before implementing UI, consider:

1. **Purpose** — What problem does this UI solve?
2. **Tone** — Data-focused minimalism (clarity over cleverness)
3. **Constraints** — WCAG AA, 44px touch, semantic tokens
4. **Differentiation** — What makes this memorable? (activity heatmap, status icons)

### Aesthetic Principles

1. **Hierarchy through space** — Use spacing/sizing before color
2. **Show, don't hide** — States visible by default, no hover-only info
3. **One pattern, many contexts** — Button/Card/Badge patterns apply everywhere
4. **Accessibility first** — WCAG 2.1 AA baseline
5. **Reduced motion always** — All animations have `motion-reduce:` fallback

---

## Part 3: Critical Rules (WCAG Compliance)

### 1. Semantic Color Tokens

```tsx
// ✅ CORRECT — works in light/dark mode
<Badge className="bg-atom-problem">Problem</Badge>
<span className="text-status-connected">Connected</span>

// ❌ WRONG — breaks dark mode, hardcoded
<Badge className="bg-rose-500">Problem</Badge>
<span className="text-green-500">Connected</span>
```

### 2. Touch Targets ≥ 44px

```tsx
// ✅ CORRECT — WCAG 2.5.5 compliant
<Button size="icon" className="h-11 w-11">

// ❌ WRONG — too small (36px < 44px)
<Button size="icon" className="h-9 w-9">
```

### 3. Status = Icon + Text (not color only)

```tsx
// ✅ CORRECT — WCAG 1.4.1 compliant
<span className="flex items-center gap-1">
  <CheckCircle className="h-4 w-4 text-status-connected" />
  <span>Connected</span>
</span>

// ❌ WRONG — color-only indicator
<span className="h-2 w-2 rounded-full bg-green-500" />
```

### 4. ARIA Labels on Icon Buttons

```tsx
// ✅ CORRECT
<Button size="icon" aria-label="Delete item"><Trash /></Button>

// ❌ WRONG — no accessible name
<Button size="icon"><Trash /></Button>
```

### 5. 4px Spacing Grid

```tsx
// ✅ CORRECT — on-grid
gap-2, gap-4, p-4, space-y-4

// ❌ WRONG — off-grid
gap-1.5, gap-2.5, p-2.5
```

### 6. Reduced Motion Support

```tsx
// ✅ CORRECT
className="animate-fade-in motion-reduce:animate-none"
```

---

## Part 4: Anti-Patterns (FORBIDDEN)

### Visual Anti-Patterns

| ❌ Don't | Why |
|----------|-----|
| Gradients (`bg-gradient-to-r`) | Against minimalist brand |
| Color-only indicators | Fails WCAG 1.4.1 |
| Purple/blue gradients | Generic "AI slop" aesthetic |
| Centered hero layouts | Cookie-cutter design |

### Technical Anti-Patterns

| ❌ Don't | Use Instead |
|----------|-------------|
| `bg-rose-500`, `bg-green-500` | `bg-atom-problem`, `bg-status-connected` |
| `h-9 w-9` for icon buttons | `h-11 w-11` (44px minimum) |
| `focus:outline-none` | Keep default or enhance |
| `style={{ }}` inline | Tailwind classes |
| `!important` | Fix specificity properly |
| Heroicons, Radix Icons | Lucide only |
| Custom button variants | Use existing shadcn |

### shadcn Variants (DO NOT MODIFY)

| Variant | Standard Style | ❌ Don't Add |
|---------|----------------|--------------|
| ghost | `hover:bg-accent hover:text-accent-foreground` | borders, gradients |
| outline | `border border-input` | custom border colors |
| default | `bg-primary shadow` | extra shadows, glows |

---

## Part 5: Token Reference

### Atom Type Colors

| Type | Token | Use |
|------|-------|-----|
| Problem | `bg-atom-problem` | Issues, bugs, risks |
| Solution | `bg-atom-solution` | Fixes, implementations |
| Decision | `bg-atom-decision` | Architecture choices |
| Question | `bg-atom-question` | Unknowns, investigations |
| Insight | `bg-atom-insight` | Learnings, patterns |

### Status Colors

| Status | Token | Icon |
|--------|-------|------|
| Connected | `bg-status-connected` | CheckCircle |
| Error | `bg-status-error` | XCircle |
| Pending | `bg-status-pending` | Clock |
| Validating | `bg-status-validating` | Loader2 (animated) |

### Spacing Scale (4px grid)

| Class | Pixels | Use |
|-------|--------|-----|
| gap-1 | 4px | Tight (icon+text) |
| gap-2 | 8px | Small |
| gap-3 | 12px | Medium |
| gap-4 | 16px | Standard |
| gap-6 | 24px | Section |

---

## Part 6: Hover & Focus States

### Hover Effects

```tsx
// ✅ GOOD — subtle, standard
hover:bg-muted         // Neutral hover for branding
hover:bg-accent        // Interactive elements
hover:text-foreground  // Subtle text change

// ❌ BAD — too flashy
hover:bg-accent on logo  // Too bright
hover:border-accent      // Unnecessary border change
hover:shadow-*           // Excessive shadows
```

### Focus Indicators

Built into shadcn, enhanced in `index.css`:
- 3px ring with 2px offset
- `focus-visible:ring-ring` token
- High contrast on all backgrounds

---

## Files Quick Reference

| Purpose | File |
|---------|------|
| CSS tokens | `frontend/src/index.css` |
| Tailwind config | `frontend/tailwind.config.js` |
| shadcn config | `frontend/components.json` |
| UI primitives | `frontend/src/shared/ui/` |
| Business components | `frontend/src/shared/components/` |
| E2E accessibility tests | `frontend/tests/e2e/accessibility.spec.ts` |

---

## Verification Commands

```bash
# TypeScript check
cd frontend && npx tsc --noEmit

# Build check
npm run build

# E2E accessibility tests
just e2e-fast accessibility.spec.ts

# Find hardcoded colors
grep -r "bg-rose-\|bg-emerald-\|bg-blue-500" frontend/src
```

---

## References

- [Design System README](../../../docs/design-system/README.md)
- [AGENTS.md (AI Rules)](../../../frontend/AGENTS.md)
- [references/AESTHETICS_COOKBOOK.md](./references/AESTHETICS_COOKBOOK.md)
- [references/ANTI_PATTERNS.md](./references/ANTI_PATTERNS.md)
