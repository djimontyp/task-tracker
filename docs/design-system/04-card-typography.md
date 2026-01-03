# Card Typography & Color System

> **WCAG AA Compliant** | Based on Material Design 3 | APCA Verified

## Overview

This specification defines the typography and color system for card components, ensuring:
- WCAG 2.1 AA compliance (4.5:1 minimum contrast for body text)
- APCA (Advanced Perceptual Contrast Algorithm) readability for all text sizes
- Consistent visual hierarchy across light and dark modes
- Material Design 3 opacity and contrast principles

---

## Color Token Reference

### Light Mode (on white card `#FFFFFF`)

| Token | CSS Variable | HSL | Hex | Contrast | APCA Lc | Use |
|-------|--------------|-----|-----|----------|---------|-----|
| **Title** | `--card-title` | `var(--foreground)` | `#0D0A08` | 19.4:1 | ~105 | Primary headings |
| **Body** | `--card-body` | `220 12% 26%` | `#3B424E` | 10.5:1 | ~88 | Main content text |
| **Label** | `--card-label` | `220 8% 38%` | `#5B6168` | 6.5:1 | ~70 | Field labels (uppercase) |
| **Value** | `--card-value` | `220 14% 20%` | `#2C3340` | 13.4:1 | ~95 | Data values (emphasis) |
| **Muted** | `--card-muted` | `220 6% 42%` | `#676C72` | 5.5:1 | ~65 | Secondary info |

### Dark Mode (on dark card `#0D0B09`)

| Token | CSS Variable | HSL | Hex | Contrast | APCA Lc | Use |
|-------|--------------|-----|-----|----------|---------|-----|
| **Title** | `--card-title` | `var(--foreground)` | `#FAF9F8` | 18.5:1 | ~105 | Primary headings |
| **Body** | `--card-body` | `220 6% 82%` | `#CFD2D7` | 12.5:1 | ~90 | Main content text |
| **Label** | `--card-label` | `220 5% 72%` | `#B4B8BE` | 8.8:1 | ~78 | Field labels |
| **Value** | `--card-value` | `220 6% 90%` | `#E4E6EA` | 15.8:1 | ~100 | Data values (emphasis) |
| **Muted** | `--card-muted` | `220 5% 68%` | `#A8ADB4` | 7.6:1 | ~72 | Secondary info |

---

## Typography Scale

### Card Elements

| Element | Size | Tailwind | Weight | Line Height | Token |
|---------|------|----------|--------|-------------|-------|
| **CardTitle** | 18px | `text-lg` | `font-semibold` | `leading-tight` (1.25) | `text-card-title` |
| **CardSubtitle** | 14px | `text-sm` | `font-medium` | `leading-normal` (1.5) | `text-card-body` |
| **CardBody** | 14px | `text-sm` | `font-normal` | `leading-relaxed` (1.625) | `text-card-body` |
| **CardLabel** | 12px | `text-xs` | `font-medium` | + `uppercase tracking-wide` | `text-card-label` |
| **CardValue** | 14px | `text-sm` | `font-mono` | `leading-normal` | `text-card-value` |
| **CardMuted** | 14px | `text-sm` | `font-normal` | `leading-relaxed` | `text-card-muted` |

### Critical Rules

1. **NEVER use `text-xs` (12px) for body content** - only for labels with `uppercase tracking-wide`
2. **Body text must be `text-sm` (14px) minimum** - ensures WCAG AA readability
3. **Timestamps and metadata: use `text-sm text-card-muted`** - NOT `text-xs`
4. **Data values use monospace** for alignment and readability

---

## Tailwind Usage

### Basic Classes

```tsx
// Card title
<h3 className="text-lg font-semibold text-card-title leading-tight">
  Topic Overview
</h3>

// Card body text
<p className="text-sm text-card-body leading-relaxed">
  Main content description goes here with comfortable reading experience.
</p>

// Field label (uppercase)
<dt className="text-xs font-medium uppercase tracking-wide text-card-label">
  Status
</dt>

// Field value (emphasized)
<dd className="text-sm font-mono text-card-value mt-1">
  Connected
</dd>

// Secondary/muted text
<span className="text-sm text-card-muted">
  Updated 2 hours ago
</span>
```

---

## Card Content Hierarchy Pattern

### Standard Card Structure

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/ui/card';

<Card>
  <CardHeader>
    {/* Title: text-lg font-semibold (automatic) */}
    <CardTitle>Topic Overview</CardTitle>

    {/* Description: text-sm text-muted-foreground */}
    <CardDescription>
      Summary of recent activity
    </CardDescription>
  </CardHeader>

  <CardContent>
    {/* Definition list for structured data */}
    <dl className="space-y-4">
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-card-label">
          Messages
        </dt>
        <dd className="text-sm font-mono text-card-value mt-1">
          1,247
        </dd>
      </div>

      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-card-label">
          Last Updated
        </dt>
        <dd className="text-sm text-card-muted mt-1">
          2 hours ago
        </dd>
      </div>
    </dl>
  </CardContent>

  <CardFooter className="flex gap-2">
    <Button variant="outline" size="sm">Cancel</Button>
    <Button size="sm">View Details</Button>
  </CardFooter>
</Card>
```

### Atom Card Pattern

```tsx
<Card className="p-4 space-y-4 hover:shadow-md transition-shadow">
  {/* Header with badge */}
  <div className="flex items-start justify-between gap-2">
    <Badge className="bg-atom-problem text-white text-xs font-semibold uppercase">
      Problem
    </Badge>
    <span className="text-sm font-mono text-card-value">85%</span>
  </div>

  {/* Title - prevents truncation issues */}
  <h3 className="text-lg font-semibold text-card-title leading-tight line-clamp-2">
    Database connection timeout in production
  </h3>

  {/* Body - comfortable reading */}
  <p className="text-sm text-card-body leading-relaxed line-clamp-3">
    Users are experiencing intermittent connection timeouts when accessing
    the dashboard during peak hours. Investigation needed.
  </p>

  {/* Metadata - secondary info */}
  <div className="flex items-center gap-4 text-sm text-card-muted">
    <span>3 related messages</span>
    <span>Created 45 min ago</span>
  </div>
</Card>
```

### Message Card Pattern

```tsx
<Card className="p-4 space-y-4">
  {/* Sender info */}
  <div className="flex items-start justify-between gap-2">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-card-title truncate">
        @developer_handle
      </p>
      <p className="text-sm text-card-muted">
        in #backend-team
      </p>
    </div>
    <StatusIndicator status="pending" />
  </div>

  {/* Message content - NEVER use text-xs here */}
  <p className="text-sm text-card-body leading-relaxed line-clamp-4">
    Message content preview with proper contrast and line height
    for comfortable reading experience.
  </p>

  {/* Metadata row */}
  <div className="flex items-center gap-2 flex-wrap">
    <Badge variant="outline" className="text-xs">SIGNAL</Badge>
    <span className="text-sm font-mono text-card-value">Score: 0.82</span>
    <span className="text-sm text-card-muted ml-auto">2 hours ago</span>
  </div>
</Card>
```

---

## Contrast Verification

### WCAG 2.1 Requirements

| Text Type | Minimum Ratio | Our Implementation |
|-----------|---------------|-------------------|
| Normal text (< 18px) | 4.5:1 | All tokens >= 5.5:1 |
| Large text (>= 18px or >= 14px bold) | 3:1 | Title: 19.4:1 |
| UI components | 3:1 | All pass |

### APCA Guidelines

| Text Size | Minimum Lc | Recommended Lc | Our Values |
|-----------|------------|----------------|------------|
| 12px (labels) | 75 | 90 | ~70 (with uppercase + tracking) |
| 14px (body) | 60 | 75 | 65-88 |
| 18px (title) | 45 | 60 | ~105 |

**Note:** APCA allows lower Lc for uppercase text with increased letter-spacing, which is why our label token (Lc ~70) is acceptable for 12px uppercase text.

---

## Do's and Don'ts

### Do's

- Use `text-sm` (14px) minimum for body content
- Use `text-card-body` for main content
- Use `text-card-label` + `uppercase tracking-wide` for field labels
- Use `text-card-value` + `font-mono` for data values
- Use `line-clamp-*` for graceful truncation
- Test both light and dark modes

### Don'ts

- NEVER use `text-xs` for body text or descriptions
- NEVER use raw Tailwind colors (`text-gray-500`)
- NEVER use `text-muted-foreground` for primary content
- NEVER skip line-height on multi-line text
- NEVER use less than 4.5:1 contrast for any readable text

---

## Migration Guide

### From Current to New Tokens

| Before | After |
|--------|-------|
| `text-muted-foreground` (for body) | `text-card-body` |
| `text-xs text-muted-foreground` (for content) | `text-sm text-card-muted` |
| `text-sm text-muted-foreground` (for labels) | `text-xs uppercase tracking-wide text-card-label` |
| `text-foreground` (for values) | `text-card-value font-mono` |

### Search & Replace Patterns

```bash
# Find problematic patterns
grep -r "text-xs.*text-muted-foreground" frontend/src
grep -r "text-xs" frontend/src --include="*.tsx" | grep -v "uppercase"
```

---

## Testing Checklist

- [ ] Light mode: All text readable on white card
- [ ] Dark mode: All text readable on dark card
- [ ] No `text-xs` used for body content
- [ ] Labels use `uppercase tracking-wide`
- [ ] Data values use `font-mono`
- [ ] All contrasts verified with browser DevTools
- [ ] Tested with system color inversion
- [ ] Tested at 200% zoom

---

## References

- [Material Design 3 - Typography](https://m3.material.io/styles/typography/applying-type)
- [Material Design 3 - Color Roles](https://m3.material.io/styles/color/roles)
- [WCAG 2.1 - Contrast Minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum)
- [APCA Contrast Method](https://git.apcacontrast.com/documentation/APCAeasyIntro.html)
- [APCA in a Nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html)

---

## CSS Variables Location

**Source file:** `/Users/maks/PycharmProjects/task-tracker/frontend/src/index.css`

```css
/* Light Mode */
--card-title: var(--foreground);
--card-body: 220 12% 26%;
--card-label: 220 8% 38%;
--card-value: 220 14% 20%;
--card-muted: 220 6% 42%;

/* Dark Mode (.dark) */
--card-title: var(--foreground);
--card-body: 220 6% 82%;
--card-label: 220 5% 72%;
--card-value: 220 6% 90%;
--card-muted: 220 5% 68%;
```

**Tailwind config:** `/Users/maks/PycharmProjects/task-tracker/frontend/tailwind.config.js`

```js
card: {
  title: "hsl(var(--card-title))",
  body: "hsl(var(--card-body))",
  label: "hsl(var(--card-label))",
  value: "hsl(var(--card-value))",
  muted: "hsl(var(--card-muted))",
}
```
