# Pulse Radar Aesthetics Cookbook

> Brand-specific design patterns for memorable UI.

## Brand Identity

**Product:** AI knowledge aggregation from Telegram/Slack
**Problem:** 100+ messages/day, 80% noise → actionable insights
**Tone:** Professional, warm, accessible (NOT corporate)

## Visual Signature Elements

### 1. Activity Heatmap
The most recognizable UI element — GitHub-style contribution graph for message activity.

```tsx
// Source colors (from CSS vars)
const SOURCE_COLORS = {
  telegram: 'hsl(var(--heatmap-telegram))',  // cyan
  slack: 'hsl(var(--heatmap-slack))',        // purple
  email: 'hsl(var(--heatmap-email))'         // green
}
```

**Key traits:**
- 52-week horizontal layout
- Cell size: 12×12px with 2px gap
- Responsive: scrollable on mobile
- Dark mode: lighter opacity for visibility

### 2. Atom Type Badges

Knowledge atoms are the core abstraction. Each type has semantic color:

| Type | Color Token | Icon | Meaning |
|------|-------------|------|---------|
| Problem | `bg-atom-problem` (red) | AlertTriangle | Issues, bugs, risks |
| Solution | `bg-atom-solution` (green) | CheckCircle | Fixes, implementations |
| Decision | `bg-atom-decision` (blue) | Diamond | Architecture choices |
| Question | `bg-atom-question` (amber) | HelpCircle | Unknowns, investigations |
| Insight | `bg-atom-insight` (purple) | Lightbulb | Learnings, patterns |

**Badge style:**
```tsx
<Badge className="bg-atom-problem text-white rounded-full px-3 py-1 text-xs font-semibold uppercase">
  Problem
</Badge>
```

### 3. Status Indicators

Never use color alone — always icon + text:

```tsx
// ✅ Connected
<span className="flex items-center gap-2">
  <CheckCircle className="h-4 w-4 text-status-connected" />
  <span className="text-sm font-medium">Connected</span>
</span>

// ✅ Validating (animated)
<span className="flex items-center gap-2">
  <Loader2 className="h-4 w-4 text-status-validating animate-spin" />
  <span className="text-sm font-medium">Validating...</span>
</span>
```

### 4. Metric Cards

Dashboard stats with trend indicators:

```tsx
<Card className="shadow-card">
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Messages Today
    </CardTitle>
    <MessageSquare className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">127</div>
    <p className="text-xs text-muted-foreground flex items-center gap-1">
      <TrendingUp className="h-3 w-3 text-status-connected" />
      +12% from yesterday
    </p>
  </CardContent>
</Card>
```

## Color Psychology

| Color | Emotion | Use Case |
|-------|---------|----------|
| Orange (primary) | Warm, action | CTAs, brand elements |
| Green | Success, trust | Connected, approved |
| Red | Alert, danger | Errors, problems |
| Amber | Caution, pending | Warnings, questions |
| Blue | Info, decision | Neutral info, decisions |
| Purple | Creative, insight | Novel observations |

## Typography Scale

System fonts for performance. Scale from Tailwind:

| Size | Class | Use |
|------|-------|-----|
| 24px | `text-2xl` | Metric numbers |
| 18px | `text-lg` | Card titles |
| 14px | `text-sm` | Body text |
| 12px | `text-xs` | Labels, badges |

**Font weights:**
- `font-bold` — metrics, headings
- `font-semibold` — badges, labels
- `font-medium` — body emphasis
- `font-normal` — body text

## Spacing Patterns

4px grid system:

| Pattern | Classes | Use |
|---------|---------|-----|
| Card padding | `p-4` (16px) | All cards |
| Section gap | `gap-6` (24px) | Between sections |
| Item gap | `gap-4` (16px) | Between items |
| Icon gap | `gap-2` (8px) | Icon + text |
| Tight gap | `gap-1` (4px) | Badge content |

## Dark Mode Considerations

All colors use CSS variables that auto-switch:

```css
/* Light */
--atom-problem: 0 84.2% 60.2%;

/* Dark — same hue, may adjust lightness */
.dark {
  --atom-problem: 0 84.2% 60.2%;
}
```

**Shadows in dark mode:**
- Use `shadow-card` which has lower opacity in dark
- Avoid `shadow-lg` — too heavy

## Motion Guidelines

Subtle, functional animations:

```tsx
// Fade in on mount
className="animate-fade-in motion-reduce:animate-none"

// Subtle hover
className="transition-colors hover:bg-muted"

// Loading spinner
<Loader2 className="animate-spin motion-reduce:animate-none" />
```

**Duration:** 150-300ms (not slower)
**Easing:** `ease-out` for entrances, `ease-in-out` for hover

## Anti-Patterns to Avoid

1. **No gradients** — against minimalist brand
2. **No glow effects** — too flashy
3. **No custom fonts** — system fonts only
4. **No centered hero sections** — data-focused layout
5. **No color-only indicators** — always icon + text
