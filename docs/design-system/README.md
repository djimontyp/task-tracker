# Pulse Radar Design System

> **TL;DR:** Semantic tokens, 4px grid, 44px touch targets, WCAG AA.

## Quick Links

| Need | Go To |
|------|-------|
| Design principles | [00-philosophy.md](./00-philosophy.md) |
| Color tokens | [01-colors.md](./01-colors.md) |
| Components | [05-components/](./05-components/) |
| AI coding rules | [frontend/AGENTS.md](../../frontend/AGENTS.md) |

## 3 Key Rules

### 1. Semantic Colors Only
```tsx
// ✅ CORRECT
<Badge className="bg-atom-problem">
<span className="text-status-connected">

// ❌ WRONG — breaks dark mode
<Badge className="bg-rose-500">
<span className="text-green-500">
```

### 2. Touch Targets ≥ 44px
```tsx
// ✅ CORRECT
<Button size="icon" className="h-11 w-11">

// ❌ WRONG — fails WCAG 2.5.5
<Button size="icon" className="h-9 w-9">
```

### 3. Status = Icon + Text (not color only)
```tsx
// ✅ CORRECT
<span className="flex items-center gap-1">
  <CheckCircle className="h-4 w-4 text-status-connected" />
  <span>Connected</span>
</span>

// ❌ WRONG — fails WCAG 1.4.1
<span className="h-2 w-2 rounded-full bg-green-500" />
```

## Token Files

| File | Purpose |
|------|---------|
| `frontend/src/index.css` | CSS variables (source of truth) |
| `tokens/tokens.json` | DTCG format for tooling |
| `tokens/tailwind.extend.js` | Tailwind config extension |

## Compliance

- **WCAG 2.1 AA** — contrast ≥4.5:1, touch ≥44px
- **Dark mode** — automatic via CSS variables
- **Reduced motion** — `prefers-reduced-motion` respected

---

**Full docs:** See numbered files in this directory.
**AI rules:** See `frontend/AGENTS.md`.
