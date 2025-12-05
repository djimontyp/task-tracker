# Color System: Pulse Radar

## Color Philosophy

**Principle:** Color conveys **meaning**, not just decoration.

**Pulse Radar Color System:**
1. **Brand Colors** — Identity and primary actions
2. **Semantic Colors** — Status, success, warning, error
3. **Atom Type Colors** — 7 knowledge types
4. **Status Indicator Colors** — Provider, validation, message states
5. **Neutral Scale** — Backgrounds, text, borders

**Key Rule:** All colors are **CSS variable-driven**. Never hardcode hex values in components. This enables:
- Consistent light/dark mode switching
- Centralized theme management
- WCAG AA compliance guaranteed
- Easy brand color changes

---

## Brand Colors

**Primary: Orange**
- **Light mode:** `24.6 95% 53.1%` → RGB `255, 107, 53`
- **Dark mode:** `20.5 90.2% 48.2%` → RGB `229, 98, 51`
- **Use:** Call-to-action buttons, brand logo, primary links
- **Contrast:** 4.8:1 on white (WCAG AA), 7.2:1 on dark gray (WCAG AAA)

**Why orange?**
- Warm and approachable (not corporate)
- High visibility without aggression
- Works well in both light and dark modes
- Commonly associated with "notification" and "action"

### Secondary Colors (Neutral Gray)
- **Light mode:** `60 4.8% 95.9%` → RGB `244, 244, 244`
- **Dark mode:** `12 6.5% 15.1%` → RGB `28, 26, 23`
- **Use:** Card backgrounds, secondary buttons, hover states
- **Contrast:** 1.3:1 (low intentional—use for very subtle backgrounds only)

### Destructive Color (Red)
- **Light mode:** `0 84.2% 40.1%` → RGB `204, 29, 31`
- **Dark mode:** `0 72.2% 50.6%` → RGB `239, 68, 68`
- **Use:** Delete confirmations, error states, critical alerts
- **Contrast:** 5.4:1 on white (WCAG AAA), 6.2:1 on light gray
- **Always paired with:** Warning icon (⚠️) and text label ("Delete permanently")

---

## Semantic Colors (Light/Dark Mode)

### Success Color
| Mode | HSL | RGB | Contrast (on white) | Contrast (on dark) |
|------|-----|-----|---------------------|-------------------|
| Light | `142 76% 36%` | `19, 120, 64` | 7.8:1 ✓ AAA | 6.2:1 ✓ AAA |
| Dark | `142 76% 36%` | `19, 120, 64` | 7.8:1 ✓ AAA | 6.2:1 ✓ AAA |

**Use:** Connected status, approved items, success messages
```jsx
<span className="text-status-connected">Provider Connected</span>
<Icon className="text-green-600" /> // For icon
```

### Warning Color
| Mode | HSL | RGB | Contrast |
|------|-----|-----|----------|
| Light | `43 96% 56%` | `249, 187, 20` | 4.8:1 ✓ AA |
| Dark | `43 96% 56%` | `249, 187, 20` | 4.8:1 ✓ AA |

**Use:** Pending status, validating providers, warnings
```jsx
<span className="text-status-pending">Validating...</span>
```

### Info Color (Blue)
| Mode | HSL | RGB | Contrast |
|------|-----|-----|----------|
| Light | `217 91% 60%` | `79, 172, 254` | 3.2:1 (borderline) |
| Dark | `217 91% 60%` | `79, 172, 254` | 3.2:1 (borderline) |

**Use:** Decision atoms, information badges, informational messages
**⚠️ Important:** Blue alone fails WCAG AA. Always pair with icon or darker shade for readability.

```jsx
// DON'T DO THIS — contrast too low
<span className="text-status-validating">Validating</span>

// DO THIS — use darker shade or add icon
<span className="flex items-center gap-1 text-blue-700">
  <Clock className="h-4 w-4" />
  Validating
</span>
```

### Error Color (Red)
| Mode | HSL | RGB | Contrast |
|------|-----|-----|----------|
| Light | `0 84.2% 60.2%` | `224, 36, 36` | 5.8:1 ✓ AAA |
| Dark | `0 84.2% 60.2%` | `224, 36, 36` | 5.8:1 ✓ AAA |

**Use:** Error states, offline status, disconnected providers
```jsx
<span className="text-status-error">Connection Failed</span>
```

---

## Neutral Scale (Grays)

Used for backgrounds, text, borders. Light mode: 0% → 100%, Dark mode: 100% → 0%.

| Token | Light (HSL) | Dark (HSL) | Use Case |
|-------|-------------|-----------|----------|
| `--background` | `0 0% 100%` | `20 14.3% 4.1%` | Page background |
| `--foreground` | `20 14.3% 4.1%` | `60 9.1% 97.8%` | Text color |
| `--card` | `0 0% 100%` | `20 14.3% 4.1%` | Card background |
| `--border` | `20 5.9% 90%` | `12 6.5% 15.1%` | Dividers, borders |
| `--input` | `20 5.9% 90%` | `12 6.5% 15.1%` | Form field backgrounds |
| `--muted` | `60 4.8% 95.9%` | `12 6.5% 15.1%` | Disabled, secondary backgrounds |
| `--muted-foreground` | `25 5.3% 33.3%` | `24 5.4% 63.9%` | Secondary text, placeholders |

**Contrast Check:**
- Black text on white: 21:1 ✓ AAA
- Muted text on white: 4.8:1 ✓ AA
- Muted text on muted bg: 1.3:1 (insufficient—avoid this combo)

---

## Atom Type Colors (7 Semantic Colors)

Knowledge atom types mapped to memorable colors. Used in AtomCard badges and type indicators.

### Problem (Red)
```css
--atom-problem: 0 84.2% 60.2%;  /* Red, warns user of issues */
```
**Light:** `#E02424` | **Dark:** `#E02424`
**Contrast:** 5.8:1 ✓ AAA
**Icon:** ⚠️ Triangle alert
**Semantics:** Issues, bugs, failures, risks

### Solution (Green)
```css
--atom-solution: 142 76% 36%;   /* Green, positive outcomes */
```
**Light:** `#137C40` | **Dark:** `#137C40`
**Contrast:** 7.8:1 ✓ AAA
**Icon:** ✓ Check circle
**Semantics:** Fixes, improvements, implementations

### Decision (Blue)
```css
--atom-decision: 217 91% 60%;   /* Blue, choices made */
```
**Light:** `#4FACFE` | **Dark:** `#4FACFE`
**Contrast:** 3.2:1 ⚠️ (Use darker shade)
**Icon:** ◆ Diamond
**Semantics:** Architecture decisions, product choices

### Question (Yellow/Amber)
```css
--atom-question: 43 96% 56%;    /* Amber, open questions */
```
**Light:** `#F9BB14` | **Dark:** `#F9BB14`
**Contrast:** 4.8:1 ✓ AA
**Icon:** ? Question circle
**Semantics:** Unknowns, clarifications needed, investigations

### Insight (Purple)
```css
--atom-insight: 280 85% 63%;    /* Purple, novel knowledge */
```
**Light:** `#D946EF` | **Dark:** `#D946EF`
**Contrast:** 3.8:1 ✓ AA
**Icon:** 💡 Lightbulb
**Semantics:** Learnings, patterns, novel observations

### Pattern (Purple)
```css
--atom-pattern: 280 85% 63%;    /* Same as insight—recurring patterns */
```
**Use:** Recurring themes, repeatable workflows

### Requirement (Blue)
```css
--atom-requirement: 217 91% 60%; /* Same as decision—mandatory items */
```
**Use:** Must-have features, constraints, specifications

**Design Rule:**
- All atom badges: `bg-atom-{type} text-white` with border-radius-full (pill shape)
- Font: 11px, semibold, uppercase
- Minimum width: 64px (don't abbreviate type labels)

---

## Status Indicator Colors

Provider status, message classification, validation states.

### Connected (Green)
```css
--status-connected: 142 76% 36%;  /* Provider online, API working */
```
**Icon:** ✓ Check circle filled
**Text:** "Connected"
**Visual:** Green dot + icon + label (never color alone)

### Validating (Blue)
```css
--status-validating: 217 91% 60%; /* In-progress validation */
```
**Icon:** ⟳ Clock / spinner
**Text:** "Validating..."
**Visual:** Blue spinner (animated if motion allowed)

### Pending (Amber)
```css
--status-pending: 43 96% 56%;     /* Awaiting action */
```
**Icon:** ⊘ Alert circle
**Text:** "Pending"
**Visual:** Yellow badge

### Error (Red)
```css
--status-error: 0 84.2% 60.2%;    /* Connection failed, validation error */
```
**Icon:** ✕ X circle filled
**Text:** "Error"
**Visual:** Red badge + error message below

**Implementation Pattern:**
```jsx
// Status Badge Component (reusable pattern)
<div className="flex items-center gap-2 px-3 py-2 rounded-md bg-{status}/10">
  <span className="h-2 w-2 rounded-full bg-{status}" />
  <span className="text-sm font-medium">{statusLabel}</span>
  {errorMessage && (
    <span className="text-xs text-muted-foreground ml-auto">{errorMessage}</span>
  )}
</div>
```

---

## Chart Colors

For data visualization (recharts), 5 distinct colors for multi-series charts.

| Token | HSL | RGB | Use |
|-------|-----|-----|-----|
| `--chart-1` | `12 76% 61%` | `245, 119, 85` | Primary series (warm) |
| `--chart-2` | `173 58% 39%` | `42, 134, 106` | Secondary (teal) |
| `--chart-3` | `197 37% 24%` | `26, 72, 102` | Tertiary (dark blue) |
| `--chart-4` | `43 74% 66%` | `242, 200, 76` | Quaternary (light amber) |
| `--chart-5` | `27 87% 67%` | `242, 156, 80` | Quinary (orange) |

**Use in activity heatmap:**
```jsx
{
  telegram: 'hsl(var(--heatmap-telegram))',    // 200 80% 50%  (cyan)
  slack: 'hsl(var(--heatmap-slack))',         // 280 70% 50%  (purple)
  email: 'hsl(var(--heatmap-email))'          // 140 70% 45%  (green)
}
```

---

## Shadow Colors

Subtle shadows for elevation without visual weight.

### Light Mode Shadow
```css
--shadow-color: 222.2 47.4% 11.2%;
--shadow-card: 0 1px 3px hsl(var(--shadow-color) / 0.06),
               0 1px 2px hsl(var(--shadow-color) / 0.04);
```
**Appearance:** Very subtle gray shadow (7% opacity)
**Use:** Card elevation, dropdowns

### Dark Mode Shadow
```css
--shadow-color: 210 40% 98%;
--shadow-card: 0 1px 3px hsl(var(--shadow-color) / 0.04),
               0 1px 2px hsl(var(--shadow-color) / 0.02);
```
**Appearance:** Very light shadow (2-4% opacity)
**Use:** On dark backgrounds, less noticeable

---

## Sidebar Colors

Sidebar has separate color system for better contrast on dark backgrounds.

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--sidebar-background` | `0 0% 98%` | `20 14.3% 4.1%` | Sidebar background |
| `--sidebar-foreground` | `240 5.3% 26.1%` | `240 4.8% 95.9%` | Sidebar text |
| `--sidebar-primary` | `24.6 95% 53.1%` | `20.5 90.2% 48.2%` | Active item |
| `--sidebar-accent` | `240 4.8% 95.9%` | `240 3.7% 15.9%` | Hover item |
| `--sidebar-border` | `220 13% 91%` | `240 3.7% 15.9%` | Divider |

---

## Color Contrast Compliance Matrix

| Combination | Ratio | WCAG | Use |
|-------------|-------|------|-----|
| White bg + black text | 21:1 | AAA | Primary body text |
| White bg + muted text | 4.8:1 | AA | Secondary labels |
| Orange bg + white text | 4.8:1 | AA | Primary buttons |
| Red bg + white text | 5.8:1 | AAA | Destructive buttons |
| Green bg + white text | 7.8:1 | AAA | Success badges |
| Blue bg + white text | 3.2:1 | ❌ | ⚠️ Use icon + text instead |
| Dark bg + light text | 10:1 | AAA | Dark mode cards |

**Non-Compliant Combinations (DON'T USE):**
- ❌ Blue badge with white text alone (add icon)
- ❌ Gray text on gray background (1.3:1, fails WCAG)
- ❌ Light text on white (insufficient contrast)

---

## How to Use Colors in Code

### Correct (Using Design Tokens)
```jsx
// Atom type badge
<span className="bg-atom-problem text-white">Problem</span>

// Status indicator
<div className="flex items-center gap-2">
  <span className="h-3 w-3 rounded-full bg-status-connected" />
  <span className="text-status-connected font-medium">Connected</span>
</div>

// Chart color
import { chart1Color } from '@/shared/config/colors'
<Bar fill={chart1Color} />
```

### Incorrect (Hardcoding Colors)
```jsx
// DON'T DO THIS — hardcoded colors
<span className="bg-rose-500 text-white">Problem</span>
<span className="bg-emerald-500">Connected</span>
<span className="bg-blue-500">Decision</span>  // Too dim!

// DON'T DO THIS — arbitrary Tailwind colors
<div className="text-slate-600">  // Wrong shade
```

### In CSS (for custom needs)
```css
/* Use CSS variables */
.custom-component {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--border));
}

/* Dark mode — automatic */
.dark .custom-component {
  background-color: hsl(var(--primary));  /* Auto-switches in :root.dark */
}
```

---

## Color Accessibility Checklist

- [ ] All text meets ≥4.5:1 contrast on white (WCAG AA)
- [ ] All UI components meet ≥3:1 contrast (WCAG AA)
- [ ] No color-only indicators (always add icon or text)
- [ ] Focus indicators visible on all backgrounds (≥3:1 contrast)
- [ ] Dark mode colors tested (same ratio requirements)
- [ ] Chart colors distinguishable for colorblind users
- [ ] Badge colors match semantic meaning (red=error, green=success)

---

## Testing Colors

### Browser DevTools
1. Right-click element → Inspect
2. Click color swatch in Styles panel
3. Check "Contrast ratio" (shows WCAG level)

### Online Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Oracle](http://colororacle.org/) — simulate colorblindness
- [Accessible Colors](https://accessible-colors.com/) — find compliant pairs

### Automated Testing
```bash
# Axe DevTools (browser extension)
# Pa11y (CLI tool)
# WAVE (browser extension)
```

---

## Color Migration Guide (From Current Hardcoded to Tokens)

### Step 1: Audit
Find all hardcoded colors:
```bash
grep -r "bg-rose-500\|bg-emerald-500\|bg-blue-500\|bg-amber-500\|bg-purple-500" frontend/src
```

### Step 2: Map to Semantic Tokens
| Hardcoded | Semantic Token | Use |
|-----------|----------------|-----|
| `bg-rose-500` | `bg-atom-problem` | Problem badges |
| `bg-emerald-500` | `bg-status-connected` | Success status |
| `bg-blue-500` | `bg-atom-decision` | Decision badges |
| `bg-amber-500` | `bg-status-pending` | Pending badges |
| `bg-purple-500` | `bg-atom-insight` | Insight badges |

### Step 3: Update Components
```jsx
// Before
const atomTypeColors: Record<AtomType, string> = {
  problem: 'bg-rose-500 text-white',
  solution: 'bg-emerald-500 text-white',
  // ...
}

// After
const atomTypeColors: Record<AtomType, string> = {
  problem: 'bg-atom-problem text-white',
  solution: 'bg-status-connected text-white',
  // ...
}
```

---

## Summary Table

| Category | Token | Light | Dark | Contrast | Use |
|----------|-------|-------|------|----------|-----|
| **Brand** | `--primary` | 24.6 95% 53% | 20.5 90% 48% | 4.8:1 | Primary action |
| **Success** | `--status-connected` | 142 76% 36% | 142 76% 36% | 7.8:1 | Success state |
| **Warning** | `--status-pending` | 43 96% 56% | 43 96% 56% | 4.8:1 | Warning state |
| **Error** | `--status-error` | 0 84% 60% | 0 84% 60% | 5.8:1 | Error state |
| **Info** | `--status-validating` | 217 91% 60% | 217 91% 60% | 3.2:1 ⚠️ | Info (use with icon) |
| **Problem** | `--atom-problem` | 0 84% 60% | 0 84% 60% | 5.8:1 | Problem badge |
| **Solution** | `--atom-solution` | 142 76% 36% | 142 76% 36% | 7.8:1 | Solution badge |
| **Decision** | `--atom-decision` | 217 91% 60% | 217 91% 60% | 3.2:1 ⚠️ | Decision badge |
| **Question** | `--atom-question` | 43 96% 56% | 43 96% 56% | 4.8:1 | Question badge |
| **Insight** | `--atom-insight` | 280 85% 63% | 280 85% 63% | 3.8:1 | Insight badge |

