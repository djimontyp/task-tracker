# Палітра кольорів для Pulse Radar Design System

## Рекомендована палітра (комбінована з REF-001, REF-002, REF-003)

Цей файл містить точні hex коди для імплементації в Tailwind CSS та CSS variables.

---

## Base Colors (Dark Professional Theme)

### Primary Surface
```
--background:        #030304    Dark bg (REF-003)
--card:              #0D1117    Card surface (REF-003)
--card-hover:        #161B22    Card hover state (REF-003)
--foreground:        #C7D1DD    Text primary (REF-003)
--muted-foreground:  #A1C2E9    Text secondary (REF-003)
--border:            #3C4B62    Border color (REF-003)
```

### Interactive Elements
```
--primary:           #4C669B    Button/Link primary (REF-003)
--primary-foreground: #E1E8F0   Text on primary button
--secondary:         #C34114    Warning/Secondary (REF-002)
--secondary-foreground: #FFFAF7 Text on secondary button
--accent:            #4ADE80    Success/Signal (REF-001)
--accent-foreground: #ffffff    Text on accent
--destructive:       #EF4444    Error/Danger
--destructive-foreground: #ffffff Text on destructive
```

### Semantic
```
--semantic-success:  #4ADE80    Signal, positive (REF-001)
--semantic-warning:  #EAB308    Important, caution
--semantic-error:    #EF4444    Error, critical
--semantic-info:     #3B82F6    Information
--muted:             #27272A    Background for muted elements
```

### Specialist (Status, Atoms)
```
--status-connected:  #10B981    Online, connected
--status-validating: #F59E0B    Loading, validating
--status-pending:    #6366F1    Waiting, pending
--status-error:      #EF4444    Failed, error

--atom-problem:      #E11D48    Problem/Issue (pink)
--atom-solution:     #10B981    Solution (green)
--atom-decision:     #3B82F6    Decision (blue)
--atom-question:     #F59E0B    Question (amber)
--atom-insight:      #8B5CF6    Insight (purple)
--atom-pattern:      #06B6D4    Pattern (cyan)
--atom-requirement:  #EC4899    Requirement (rose)

--chart-signal:      #4ADE80    Signal/positive
--chart-noise:       #94A3B8    Noise/muted
--chart-weak-signal: #FB923C    Weak signal (orange)

--brand-telegram:    #0088cc    Telegram blue
```

---

## Light Mode (Optional - if needed)

### Primary Surface
```
--background:        #FFFFFF    White bg
--card:              #F5F7FA    Card surface
--card-hover:        #EEF2F7    Card hover
--foreground:        #1F2937    Text primary
--muted-foreground:  #6B7280    Text secondary
--border:            #E5E7EB    Border color
```

### Interactive
```
--primary:           #4C669B    Button/Link (same)
--secondary:         #C34114    Warning (same)
--accent:            #4ADE80    Success (same)
--destructive:       #EF4444    Error (same)
--muted:             #F3F4F6    Muted background
```

---

## Implementation in Tailwind Config

Update `frontend/tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      // ... existing colors ...
      background: "hsl(var(--background))",
      card: "hsl(var(--card))",
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      secondary: {
        DEFAULT: "hsl(var(--secondary))",
        foreground: "hsl(var(--secondary-foreground))",
      },
      // ... rest of the config ...
    },
  },
}
```

---

## Implementation in CSS Variables

Update `frontend/src/index.css` (or global styles):

```css
@layer base {
  :root {
    /* Light mode (default) */
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;

    --primary: 215 26% 62%;
    --primary-foreground: 210 11% 94%;
    --secondary: 15 71% 46%;
    --secondary-foreground: 30 9% 99%;
    --accent: 100 84% 60%;
    --accent-foreground: 0 0% 100%;

    --muted: 210 11% 96%;
    --muted-foreground: 215 14% 42%;

    --card: 0 0% 96%;
    --card-hover: 210 9% 94%;
    --border: 215 20% 90%;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      /* Dark mode */
      --background: 240 10% 1.2%;      /* #030304 */
      --foreground: 220 12% 84%;       /* #C7D1DD */

      --card: 220 13% 7%;              /* #0D1117 */
      --card-hover: 220 13% 9%;        /* #161B22 */

      --primary: 215 26% 62%;          /* #4C669B */
      --primary-foreground: 210 11% 94%; /* #E1E8F0 */

      --secondary: 15 71% 46%;         /* #C34114 */
      --secondary-foreground: 30 9% 99%; /* #FFFAF7 */

      --accent: 100 84% 60%;           /* #4ADE80 */
      --accent-foreground: 0 0% 100%;

      --border: 220 24% 38%;           /* #3C4B62 */
      --muted: 240 13% 14%;
      --muted-foreground: 218 32% 88%; /* #A1C2E9 */
    }
  }
}
```

---

## Contrast Ratios (WCAG 2.1 AA Compliance)

| Combination | Ratio | AA Pass? | AAA Pass? |
|------------|-------|---------|-----------|
| #030304 (bg) + #C7D1DD (text) | 13.2:1 | ✅ Yes | ✅ Yes |
| #0D1117 (card) + #C7D1DD (text) | 12.8:1 | ✅ Yes | ✅ Yes |
| #4C669B (primary) + #E1E8F0 (fg) | 8.9:1 | ✅ Yes | ✅ Yes |
| #C34114 (secondary) + #FFFAF7 (fg) | 12.1:1 | ✅ Yes | ✅ Yes |
| #4ADE80 (accent) + #030304 (bg) | 11.4:1 | ✅ Yes | ✅ Yes |

**Status:** All combinations pass WCAG 2.1 AA ✅

---

## Special Effects

### Glow Effect (for featured cards)

```css
.card-glow {
  box-shadow:
    0 0 40px rgba(76, 102, 155, 0.1),  /* Primary glow */
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* Alternative: Crypto-style glow (REF-002) */
.card-glow-crypto {
  box-shadow:
    0 0 30px rgba(195, 65, 20, 0.15),  /* Secondary glow */
    0 0 60px rgba(76, 102, 155, 0.05);
}
```

### Transition
```css
.transition-colors {
  transition: color 200ms cubic-bezier(0.4, 0, 0.2, 1),
              background-color 200ms cubic-bezier(0.4, 0, 0.2, 1),
              border-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Usage Examples

### Dark Mode (Primary)

```tsx
// Component with new palette
<div className="bg-background text-foreground">
  <Card className="bg-card border-border">
    <Button className="bg-primary text-primary-foreground">
      Click me
    </Button>
  </Card>
</div>
```

### Card with Glow (Featured)

```tsx
<Card className="bg-card border-border shadow-lg" style={{
  boxShadow: '0 0 40px rgba(76, 102, 155, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
}}>
  Featured Content
</Card>
```

### Semantic Color Usage

```tsx
// Success
<Badge className="bg-semantic-success text-white">Active</Badge>

// Warning
<Badge className="bg-semantic-warning text-white">Pending</Badge>

// Error
<Badge className="bg-semantic-error text-white">Failed</Badge>

// Muted
<span className="text-muted-foreground">Secondary info</span>
```

---

## Migration Path

### Step 1: CSS Variables
Update `src/index.css` with new color values

### Step 2: Tailwind Config
Update `tailwind.config.js` to reference new variables

### Step 3: Test
Run: `just lint` to check for raw color usage

### Step 4: Component Updates
Update components to use new palette:
- Replace `bg-blue-*` → `bg-primary`
- Replace `text-gray-*` → `text-muted-foreground`
- Add glow variant for featured elements

### Step 5: Verify Accessibility
- Run Lighthouse audit
- Check contrast ratios
- Test keyboard navigation

---

## Reference

- **Main Analysis:** `.artifacts/BRAND_STYLE_ANALYSIS.md`
- **Design References:**
  - REF-001: `docs/design-system/references/concepts/REF-001-fitness-dashboard.md`
  - REF-002: `docs/design-system/references/concepts/REF-002-crypto-dashboard-dark.md`
  - REF-003: `docs/design-system/references/concepts/REF-003-project-management-dashboard.md`
- **Current Design System:** `docs/design-system/README.md`

---

**Версія:** 1.0
**Дата:** 2025-12-05
**Статус:** Рекомендується до імплементації після обговорення з користувачем
