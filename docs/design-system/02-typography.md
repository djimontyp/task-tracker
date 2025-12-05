# Typography System: Pulse Radar

## Font Family

**Primary Font:** Inter

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
             'Helvetica Neue', sans-serif;
```

**Why Inter?**
- Designed for screens (high readability at small sizes)
- Excellent metric compatibility (natural spacing)
- Supports 18 weights (400, 500, 600, 700 used in Pulse Radar)
- OpenType features: kern, liga, ss01 (styling alternates)
- Variable font available (single file, all weights)

**Fallback Stack:**
1. System fonts (Apple San Francisco, Segoe UI)
2. Open source alternatives (Ubuntu, Fira Sans)
3. Generic `sans-serif` (last resort)

**Font Features (CSS):**
```css
body {
  font-feature-settings: "kern" 1, "liga" 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## Type Scale

**Mobile-first responsive scale.** Text scales up at tablet (640px) and desktop (1024px) breakpoints.

| Level | Mobile (xs) | Tablet (sm) | Desktop (lg) | Line Height | Weight | Use |
|-------|----------|-----------|------------|-------------|--------|-----|
| **xs** | 12px | 12px | 12px | 16px | 400 | Captions, timestamps, helper text |
| **sm** | 13px | 13px | 13px | 18px | 400 | Small text, placeholders |
| **base** | 14px | 14px | 14px | 20px | 400 | Body text (default) |
| **lg** | 14px | 16px | 16px | 24px | 400 | Larger body text, labels |
| **xl** | 16px | 18px | 18px | 28px | 600 | Page section headings |
| **2xl** | 18px | 20px | 20px | 28px | 600 | Page subheadings |
| **3xl** | 20px | 24px | 24px | 32px | 700 | Page main heading |
| **4xl** | 24px | 28px | 32px | 36px | 700 | Rarely used (hero sections) |

### Tailwind Configuration

```javascript
// tailwind.config.js
fontSize: {
  xs: ['12px', { lineHeight: '16px' }],
  sm: ['13px', { lineHeight: '18px' }],
  base: ['14px', { lineHeight: '20px' }],
  lg: ['16px', { lineHeight: '24px' }],
  xl: ['18px', { lineHeight: '28px' }],
  '2xl': ['20px', { lineHeight: '28px' }],
  '3xl': ['24px', { lineHeight: '32px' }],
  '4xl': ['32px', { lineHeight: '36px' }],
}
```

### Responsive Usage Examples

```jsx
// Card title — scales mobile to desktop
<h3 className="text-base sm:text-lg md:text-xl font-semibold">
  Atom Title
</h3>

// Body text — same size, consistent hierarchy
<p className="text-base text-muted-foreground">
  Atom content description
</p>

// Small badge — no scale (always 12px)
<span className="text-xs font-semibold px-2 py-1">
  PROBLEM
</span>

// Page heading — scales significantly
<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
  Messages
</h1>
```

---

## Font Weights

**Available Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

| Weight | Class | Use |
|--------|-------|-----|
| **400** | `font-normal` | Body text, default |
| **500** | `font-medium` | Form labels, breadcrumbs |
| **600** | `font-semibold` | Card titles, button text, badges |
| **700** | `font-bold` | Page headings, emphasis |

### Weight Usage Patterns

```jsx
// Body text — 400 weight
<p className="font-normal">
  This is regular paragraph text.
</p>

// Form labels — 500 weight
<label className="font-medium">
  Email address
</label>

// Card titles, badges — 600 weight
<h3 className="font-semibold">Card Title</h3>
<span className="font-semibold px-2 py-1">INSIGHT</span>

// Page headings — 700 weight
<h1 className="font-bold">Messages</h1>
```

**⚠️ Don't use:**
- 300 (Light) — too thin for readability
- 800, 900 (Black/Extra Bold) — too heavy, rarely needed

---

## Line Height

**Principle:** Generous line height improves readability, especially on mobile.

| Context | Line Height | Calculation | Accessibility |
|---------|----------|-------------|----------|
| Body text (14px) | 20px | 1.43× | Comfortable for reading |
| Small text (12px) | 16px | 1.33× | Compact but readable |
| Headings (16-24px) | 28-32px | 1.4-1.75× | Visual separation |
| Form inputs (44px) | 20px (inherited) | — | Centered text |

**CSS Variables (if custom styling needed):**
```css
:root {
  --line-height-normal: 1.43;  /* 14px × 1.43 = 20px */
  --line-height-tight: 1.2;    /* Headings */
  --line-height-relaxed: 1.75; /* Long-form content */
}
```

**WCAG Guideline (WCAG 2.4.3):**
- Minimum 1.5× line height for body text ✓ (we use 1.43× for 14px, acceptable)
- Minimum 1.3× spacing between paragraphs

---

## Text Hierarchy

### Heading Levels (H1-H6)

**H1 — Page Title** (rarely used, often in page header)
```jsx
<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
  Messages
</h1>
```
- Mobile: 18px | Tablet: 20px | Desktop: 24px
- Weight: 700 (bold)
- Color: `foreground` (text-foreground)
- Spacing: Bottom margin 16px

**H2 — Section Heading** (main content sections)
```jsx
<h2 className="text-xl sm:text-2xl font-bold">
  Recent Topics
</h2>
```
- Mobile: 16px | Tablet: 18px | Desktop: 20px
- Weight: 700
- Color: `foreground`
- Spacing: Top 20px, Bottom 12px

**H3 — Card/Component Title** (most common)
```jsx
<h3 className="text-base sm:text-lg font-semibold">
  Atom Title
</h3>
```
- Mobile: 14px | Tablet: 14px | Desktop: 16px
- Weight: 600 (semibold)
- Color: `foreground`
- Spacing: Bottom 8px

**H4 — Secondary Title** (subsections)
```jsx
<h4 className="text-sm sm:text-base font-semibold">
  Section subtitle
</h4>
```
- Mobile: 13px | Tablet: 14px | Desktop: 14px
- Weight: 600
- Color: `foreground`

**H5/H6 — Rarely used** (form labels instead)

### Body Text

**Regular Paragraph**
```jsx
<p className="text-base text-foreground">
  Main paragraph content goes here.
</p>
```
- Size: 14px (all breakpoints)
- Line height: 20px (1.43×)
- Color: `foreground` (text-foreground)

**Secondary Text** (help text, hints)
```jsx
<p className="text-sm text-muted-foreground">
  Supporting information or explanation.
</p>
```
- Size: 13px
- Color: `muted-foreground` (contrast 4.8:1 ✓)
- Line height: 18px

**Small Text** (captions, timestamps, assistant text)
```jsx
<span className="text-xs text-muted-foreground">
  Created 2 hours ago
</span>
```
- Size: 12px (minimum WCAG AA readable size)
- Color: `muted-foreground`
- Weight: 400 (normal)
- ⚠️ Don't use for essential content

---

## Link Styling

**Default Links** (using Button link variant)
```jsx
<button className="text-primary underline-offset-4 hover:underline">
  Read more
</button>
```
- Color: `primary` (orange)
- Underline: On hover only
- Underline offset: 4px (WCAG requirement)
- Focus: 3px ring outline (from global focus styles)

**Icon Links**
```jsx
<a href="/topics" className="flex items-center gap-1 text-primary hover:text-primary/80">
  <ChevronRight className="h-4 w-4" />
  View all topics
</a>
```
- Include icon for visual clarity
- Hover color: 10% darker
- Always has visible focus indicator

---

## Form Text

### Input Labels
```jsx
<label htmlFor="email" className="text-sm font-medium">
  Email address
</label>
<input
  id="email"
  type="email"
  className="text-base"  // Never smaller than 16px (prevents iOS zoom)
/>
```
- Label: 13px, medium weight
- Input text: 14px (or 16px on mobile to prevent zoom)
- Placeholder: muted-foreground color
- Help text: 12px, secondary color

### Form Field States

```jsx
// Default
<input className="border border-input bg-background text-base" />

// Focus
<input className="ring-2 ring-ring ring-offset-2" />

// Error
<input className="border-destructive" />
<span className="text-xs text-destructive">Email is required</span>

// Disabled
<input className="disabled:cursor-not-allowed disabled:opacity-50" />
```

---

## Special Text Elements

### Badge Text
```jsx
<span className="text-xs font-semibold uppercase px-2 py-1 rounded-full">
  PROBLEM
</span>
```
- Size: 12px (xs)
- Weight: 600 (semibold)
- Transform: `uppercase`
- Letter spacing: None (Inter handles it)

### Button Text
```jsx
<button className="text-sm font-medium">
  Submit
</button>
```
- Size: 14px (text-sm in Tailwind)
- Weight: 600 (default in buttonVariants)
- No transform (except when content is uppercase)

### Breadcrumb Text
```jsx
<nav className="text-sm text-muted-foreground">
  <a href="/">Dashboard</a>
  <span>/</span>
  <span>Messages</span>
</nav>
```
- Size: 13px (text-sm)
- Color: Muted (secondary importance)
- Separator: `/` character or arrow `>`

### Code/Monospace (if needed)
```jsx
<code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
  GET /api/atoms
</code>
```
- Font: `font-mono` (system monospace: Menlo, Monaco, etc.)
- Size: 12px (smaller than body)
- Background: Subtle highlight

---

## Responsive Typography Rules

### Mobile-First Approach
```jsx
// Write mobile first, then enhance on larger screens
<h2 className="text-lg sm:text-xl md:text-2xl">
  Section Heading
</h2>
// Reads as: 16px on mobile, 18px on tablet (640px+), 20px on desktop (1024px+)
```

### When NOT to Scale
```jsx
// Icon labels — too small to scale
<span className="text-xs">Created</span>  // Always 12px

// Form fields — never scale (prevents mobile zoom)
<input className="text-base" />  // Always 14px (or 16px for iOS)

// Badges/pills — consistent size
<span className="text-xs font-semibold">INSIGHT</span>  // Always 12px
```

### Testing Responsive Text
```html
<!-- Test at 375px width (mobile) -->
<!-- Test at 640px width (tablet) -->
<!-- Test at 1024px width (desktop) -->
<!-- Verify no text clipping or overflow -->
```

---

## Contrast & Readability

### Text Color Combinations (Light Mode)

| Text Color | Background | Ratio | WCAG | Use |
|-----------|-----------|-------|------|-----|
| foreground | background | 21:1 | AAA | Primary text |
| muted-foreground | background | 4.8:1 | AA | Secondary text |
| primary | background | 4.8:1 | AA | Links, accents |
| destructive | background | 5.8:1 | AAA | Error text |

### Text Color Combinations (Dark Mode)

| Text Color | Background | Ratio | WCAG | Use |
|-----------|-----------|-------|------|-----|
| foreground | dark-background | 10:1 | AAA | Primary text |
| muted-foreground | dark-background | 4.8:1 | AA | Secondary text |
| primary | dark-background | 4.8:1 | AA | Links, accents |
| destructive | dark-background | 5.8:1 | AAA | Error text |

**⚠️ Never use:**
- Light text on light background
- Small text (<14px) with <4.5:1 contrast
- Muted text on muted background

---

## Spacing Between Text Elements

### Vertical Spacing (Between Elements)

```jsx
<div className="space-y-2">
  {/* 8px between elements */}
</div>

<div className="space-y-4">
  {/* 16px between elements */}
</div>
```

| Spacing | Pixels | Use |
|---------|--------|-----|
| `space-y-1` | 4px | Rarely (too tight) |
| `space-y-2` | 8px | Between badge + text |
| `space-y-3` | 12px | Between form fields |
| `space-y-4` | 16px | Between sections |
| `space-y-6` | 24px | Major section breaks |

### Paragraph Spacing (Within Text)

```css
p + p {
  margin-top: 16px;  /* gap-4 */
}
```

---

## Text Truncation & Overflow

### Single Line Truncation
```jsx
<h3 className="text-lg font-semibold truncate">
  Very long atom title that exceeds container width
</h3>
```
- Class: `truncate` (equivalent to `overflow-hidden text-ellipsis whitespace-nowrap`)
- Result: "Very long atom title that exceed..."

### Multi-Line Truncation
```jsx
<p className="text-sm text-muted-foreground line-clamp-3">
  This is a longer description that might span multiple lines
  but we want to show only the first 3 lines with ellipsis.
</p>
```
- Class: `line-clamp-{n}` (where n = 2, 3, 4, 5, 6)
- Result: Shows exactly 3 lines, then "..."

### No Truncation (for long content)
```jsx
<div className="whitespace-normal break-words">
  {veryLongContent}
</div>
```
- Class: `whitespace-normal` (allows wrapping)
- Add `break-words` if text contains no spaces

---

## Dark Mode Text Colors

All text colors automatically adjust in dark mode via CSS variables.

```css
:root {
  --foreground: 20 14.3% 4.1%;  /* Light mode: nearly black */
  --muted-foreground: 25 5.3% 33.3%;
}

.dark {
  --foreground: 60 9.1% 97.8%;  /* Dark mode: nearly white */
  --muted-foreground: 24 5.4% 63.9%;
}
```

**No additional styling needed:**
```jsx
// Automatically adjusts light → dark
<p className="text-foreground">This text adjusts automatically</p>
<p className="text-muted-foreground">This too</p>
```

---

## Reduced Motion Support

All text animations respect `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Typography Checklist

- [ ] Page headings use `text-2xl sm:text-3xl md:text-4xl`
- [ ] Body text never smaller than 14px
- [ ] Link underlines visible (hover or always)
- [ ] Form labels have `<label for="">` associations
- [ ] All text meets ≥4.5:1 contrast on background
- [ ] Small text (12px) only for non-essential info
- [ ] Line height ≥1.4 for body text (1.43 used)
- [ ] Headings use semibold (600) or bold (700)
- [ ] No custom font sizes (use scale only)

---

## Summary Table

| Element | Mobile | Tablet | Desktop | Weight | Line Height | Color |
|---------|--------|--------|---------|--------|-------------|-------|
| **H1** | 18px | 20px | 24px | 700 | 28px | foreground |
| **H2** | 16px | 18px | 20px | 700 | 28px | foreground |
| **H3** | 14px | 14px | 16px | 600 | 20px | foreground |
| **Body** | 14px | 14px | 14px | 400 | 20px | foreground |
| **Label** | 13px | 13px | 13px | 500 | 18px | foreground |
| **Small** | 13px | 13px | 13px | 400 | 18px | muted-foreground |
| **XS** | 12px | 12px | 12px | 400 | 16px | muted-foreground |

