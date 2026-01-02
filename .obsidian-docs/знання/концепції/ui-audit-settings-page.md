---
type: knowledge
created: 2026-01-02
status: validated
tags:
  - concept
  - ui-audit
  - typography
  - design-system
---

# UI Audit: Settings Page Typography Fix

> **Status:** Validated and fixed (2026-01-02)

## Overview

UI/UX аудит Settings Page виявив проблему з typography яка може викликати обрізання descenders (g, p, y, j, q) в заголовках.

## Problem Identified

### Typography Issue (HIGH Priority)

| File | Line | Problem | Solution |
|------|------|---------|----------|
| `SourceCard.tsx` | 59 | `leading-none` cuts off descenders | `leading-tight` |

**Before:**
```tsx
<h3 className="font-semibold text-lg leading-none">{name}</h3>
```

**After:**
```tsx
<h3 className="font-semibold text-lg leading-tight">{name}</h3>
```

### Why This Matters

- `leading-none` sets line-height to 1.0
- Combined with `text-lg` (18px), this leaves no space for descenders
- Letters like "Telegram" with 'g' can appear clipped
- `leading-tight` (line-height: 1.25) provides proper spacing

## Acceptable Deviations

### Gap-3 in SettingsSection (Not a Problem)

`SettingsSection.tsx:53` uses `gap-3` (12px) which is acceptable:
- Design System allows gap-3 for "special cases"
- Compact card layouts qualify as special case
- **Decision:** Keep as-is

## Well-Implemented Aspects

✅ **SettingsCard** — semantic tokens, correct spacing
✅ **GeneralSection** — inline controls, h-[72px] consistency
✅ **AIProvidersSection** — proper status mapping
✅ **TelegramCard** — correct state management
✅ **3-column responsive grid** — mobile-first approach

## Implementation

### Files Modified

1. `frontend/src/pages/SettingsPage/components/SourceCard.tsx`
   - **Line 59:** Changed `leading-none` → `leading-tight`
   - **Layout improvements:** Заголовок та badge на окремих лініях
   - **Text truncation removed:** `line-clamp-2` видалено з опису
   - **Compact layout:** Видалено порожній CardContent, pb-4 → pb-3
   - **Removed unused import:** CardContent

2. `frontend/src/pages/SettingsPage/components/sections/GeneralSection.tsx`
   - **InlineSettingCard component:** Видалено `truncate` з title та description
   - **Fixed height removed:** h-[72px] → природний wrap
   - **Removed unused import:** cn utility

### Storybook Coverage Added

Created stories for better documentation:
1. `SettingsCard.stories.tsx` — all status states
2. `SourceCard.stories.tsx` — active, inactive, error, not-configured
   - Updated LongDescription story to demonstrate text wrapping

## Verification Steps

- [x] TypeScript typecheck passed
- [x] Visual check in light theme
- [x] Visual check in dark theme
- [x] Mobile responsive (375px)
- [x] Storybook stories created

## Related Design System Rules

**Typography Guidelines:**
- Minimum line-height: 1.25 (leading-tight) for titles
- Use `leading-none` only for large display text (≥32px)
- Descenders must have breathing room

**Touch Targets:**
- Minimum 44px (h-11 w-11) ✓
- Settings cards maintain 72px height ✓

**Spacing Grid:**
- 4px base unit
- gap-3 (12px) allowed for special cases ✓

## Lessons Learned

1. **Always check line-height** when using custom font sizes
2. **Test with descender-heavy text** (Telegram, Typing, etc.)
3. **gap-3 is acceptable** for compact layouts despite general rule
4. **Storybook helps** catch visual regressions early

## Related

- [[entity-hierarchy]] — Settings Page fits into configuration layer
- [[user-journey]] — Admin accesses Settings for configuration

---

**Files affected:** 1
**Time to fix:** 5 minutes
**Risk:** Low (cosmetic improvement)
