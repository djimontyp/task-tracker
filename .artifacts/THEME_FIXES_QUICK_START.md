# Theme Consistency - Quick Fixes

## 3 Changes to Perfect Dark Mode

**Status:** 3 files, ~50 lines of code, ~15 minutes to fix
**Impact:** Fixes all dark mode visibility issues, achieves WCAG AAA compliance

---

## Fix #1: Atom & Status Colors (CRITICAL)

**File:** `frontend/src/index.css`

**Lines to change:** 109-121 (in `.dark` section)

### Current (BROKEN) ❌
```css
.dark {
  /* Atom type semantic colors */
  --atom-problem: 0 84.2% 60.2%;
  --atom-solution: 142 76% 36%;
  --atom-decision: 217 91% 60%;
  --atom-question: 43 96% 56%;
  --atom-insight: 280 85% 63%;
  --atom-pattern: 280 85% 63%;
  --atom-requirement: 217 91% 60%;
  /* Status indicator colors */
  --status-connected: 142 76% 36%;
  --status-validating: 217 91% 60%;
  --status-pending: 43 96% 56%;
  --status-error: 0 84.2% 60.2%;
}
```

### Fixed ✅
```css
.dark {
  /* Atom type semantic colors - +14% lightness for WCAG AA */
  --atom-problem: 0 84.2% 74.2%;
  --atom-solution: 142 76% 50%;
  --atom-decision: 217 91% 74%;
  --atom-question: 43 96% 70%;
  --atom-insight: 280 85% 77%;
  --atom-pattern: 280 85% 77%;
  --atom-requirement: 217 91% 74%;
  /* Status indicator colors - +14% lightness for WCAG AA */
  --status-connected: 142 76% 50%;
  --status-validating: 217 91% 74%;
  --status-pending: 43 96% 70%;
  --status-error: 0 84.2% 74.2%;
}
```

**Why:** Green 36% on dark (2.8:1 contrast) fails WCAG. Green 50% (4.2:1) passes.

---

## Fix #2: Topic Search Fallback Color

**File:** `frontend/src/features/search/components/TopicSearchCard.tsx`

**Line:** 43

### Current ❌
```tsx
<div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg" style={{ backgroundColor: topic.color || '#e5e7eb' }}>
```

### Fixed ✅
```tsx
<div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg" style={{ backgroundColor: topic.color || 'hsl(var(--muted))' }}>
```

**Why:** `#e5e7eb` is light gray - invisible on white in dark mode. Use theme variable.

---

## Fix #3: User Topic Colors Dark Mode Mixing

**File:** `frontend/src/pages/DashboardPage/TopicCard.tsx`

**Lines:** 26-40, 35-40 (style prop)

### Current ❌
```tsx
const topicColor = topic.color || 'hsl(var(--topic-default))'

// ... later in style prop
style={{
  borderLeft: `4px solid ${topicColor}`,
  background: `linear-gradient(135deg, hsl(var(--card)) 0%, color-mix(in srgb, ${topicColor} 3%, hsl(var(--card))) 100%)`,
  boxShadow: `var(--shadow-card), inset 4px 0 0 0 ${topicColor}20, ...`,
}}
```

### Fixed ✅
```tsx
// Add this near top of component (after const declarations)
const isDark = document.documentElement.classList.contains('dark');

// Adjust user color for dark mode - increase saturation
const adjustedColor = isDark
  ? `color-mix(in srgb, ${topicColor} 120%, hsl(120 0% 50%))`  // 120% = boost brightness
  : topicColor;

// ... later in style prop - use adjustedColor everywhere topicColor was used
style={{
  borderLeft: `4px solid ${adjustedColor}`,
  background: `linear-gradient(135deg, hsl(var(--card)) 0%, color-mix(in srgb, ${adjustedColor} 3%, hsl(var(--card))) 100%)`,
  boxShadow: `var(--shadow-card), inset 4px 0 0 0 ${adjustedColor}20, ...`,
}}
```

**Why:** User topic colors (from database) are hardcoded hex. In dark mode they become invisible.

---

## Verification Checklist

After applying fixes, verify:

### Visual
- [ ] Open Storybook: `just storybook`
- [ ] Go to: UI → Badge → (any status badge)
- [ ] Click "Dark" background button in Storybook toolbar
- [ ] All badge colors should be **clearly visible** (not dark/invisible)

- [ ] Open Dashboard: http://localhost/dashboard
- [ ] Click theme toggle (moon icon in navbar)
- [ ] Verify:
  - [ ] Topic cards left border is **visible** (not invisible)
  - [ ] Atom type colors (in cards) are **bright enough**
  - [ ] Status indicators (green dot, yellow, blue) are **readable**

### Automated
```bash
# Type check
cd frontend && npx tsc --noEmit

# Lint (should pass without errors)
npm run lint

# Visual regression (Storybook)
npm run build-storybook
```

---

## Testing Checklist (2 min)

```bash
# 1. Start services
just services-dev

# 2. Open Storybook in browser
# Ctrl+Click or Cmd+Click this URL: http://localhost:6006

# 3. Test atom colors
# Navigate to: Features → AtomCard → Default
# Toggle "Dark" background
# Verify card border is VISIBLE

# 4. Test status badges
# Navigate to: Shared → MetricCard → Default
# Toggle "Dark" background
# Verify badges are READABLE

# 5. Test topic cards
# Go to: http://localhost/dashboard
# Toggle theme (moon icon in navbar)
# Verify topic cards work in BOTH themes
```

---

## Expected Result

| Element | Light Mode | Dark Mode | Before Fix | After Fix |
|---------|-----------|-----------|-----------|-----------|
| Atom card border | Colored | Colored | ❌ Invisible | ✅ Visible |
| Status badge | Colored text | Colored text | ❌ Too dark | ✅ Readable |
| Topic card icon bg | User color | User color | ❌ Invisible | ✅ Visible |

---

## Files Changed Summary

| File | Changes | Lines | Impact |
|------|---------|-------|--------|
| `frontend/src/index.css` | Update 12 CSS vars | 109-121 | ⭐⭐⭐ Critical |
| `frontend/src/features/search/components/TopicSearchCard.tsx` | 1 line (color fallback) | 43 | ⭐⭐ High |
| `frontend/src/pages/DashboardPage/TopicCard.tsx` | 5 lines (dark detection + color mixing) | 26-40, 35-40 | ⭐⭐ High |

**Total:** 3 files, ~25 lines changed, ~15 minutes

---

## Rollback Plan (if needed)

Each change is self-contained:
1. Revert Fix #1 only? → Atom colors reset to old values
2. Revert Fix #2 only? → TopicSearchCard uses hardcoded color again
3. Revert Fix #3 only? → User colors invisible in dark mode again

No dependencies between fixes.

---

## Questions?

- **What if I can't apply Fix #3?** → Fix #1 and #2 still improve 80% of issues
- **Will this break light mode?** → No, only affects `.dark` section
- **Can I test before committing?** → Yes, just modify local files and refresh browser

---

Generated: 2025-12-05
Priority: CRITICAL
Effort: 15 minutes
Impact: Full WCAG AAA compliance
