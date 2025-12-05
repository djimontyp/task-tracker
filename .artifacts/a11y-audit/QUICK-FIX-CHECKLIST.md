# Quick Fix Checklist: Accessibility Violations (8 minutes)

## Overview
4 critical WCAG 2.1 AA violations found. All are icon button missing `aria-label` attributes.

---

## Fix #1: JobsTable.tsx
**File**: `/frontend/src/features/automation/components/JobsTable.tsx`
**Line**: 123
**Issue**: Dropdown trigger missing aria-label

### Before
```tsx
<DropdownMenuTrigger asChild>
  <Button variant="ghost" size="icon">
    <EllipsisVerticalIcon className="h-4 w-4" />
  </Button>
</DropdownMenuTrigger>
```

### After
```tsx
<DropdownMenuTrigger asChild>
  <Button variant="ghost" size="icon" aria-label="Job actions">
    <EllipsisVerticalIcon className="h-4 w-4" />
  </Button>
</DropdownMenuTrigger>
```

**Time**: 1-2 minutes
**Testing**: Visual - focus visible on button, Screen reader - announces "Job actions"

---

## Fix #2: RulePerformanceTable.tsx
**File**: `/frontend/src/features/automation/components/RulePerformanceTable.tsx`
**Line**: 94
**Issue**: Dropdown trigger missing aria-label

### Before
```tsx
<DropdownMenuTrigger asChild>
  <Button variant="ghost" size="icon">
    <EllipsisVerticalIcon className="h-4 w-4" />
  </Button>
</DropdownMenuTrigger>
```

### After
```tsx
<DropdownMenuTrigger asChild>
  <Button variant="ghost" size="icon" aria-label="Rule actions">
    <EllipsisVerticalIcon className="h-4 w-4" />
  </Button>
</DropdownMenuTrigger>
```

**Time**: 1-2 minutes
**Testing**: Visual - focus visible on button, Screen reader - announces "Rule actions"

---

## Fix #3: RuleConditionInput.tsx
**File**: `/frontend/src/features/automation/components/RuleConditionInput.tsx`
**Line**: 119
**Issue**: Delete/remove button missing aria-label

### Before
```tsx
<Button variant="ghost" size="icon" onClick={onRemove} type="button">
  <XMarkIcon className="h-4 w-4" />
</Button>
```

### After
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={onRemove}
  type="button"
  aria-label="Remove condition"
>
  <XMarkIcon className="h-4 w-4" />
</Button>
```

**Time**: 1-2 minutes
**Testing**: Visual - focus visible on button, Screen reader - announces "Remove condition, button"

---

## Fix #4: TopicsPage/index.tsx
**File**: `/frontend/src/pages/TopicsPage/index.tsx`
**Line**: 196
**Issue**: Clear search button missing aria-label

### Before
```tsx
{searchQuery && (
  <Button
    variant="ghost"
    size="icon"
    onClick={() => setSearchQuery('')}
    className="absolute right-2 top-2/2 -translate-y-1/2"
  >
    <XMarkIcon className="h-5 w-5" />
  </Button>
)}
```

### After
```tsx
{searchQuery && (
  <Button
    variant="ghost"
    size="icon"
    onClick={() => setSearchQuery('')}
    className="absolute right-2 top-2/2 -translate-y-1/2"
    aria-label="Clear search"
  >
    <XMarkIcon className="h-5 w-5" />
  </Button>
)}
```

**Time**: 1-2 minutes
**Testing**: Visual - focus visible on button, Screen reader - announces "Clear search, button"

---

## Verification Checklist

### After Each Fix
- [ ] Visual check: button still displays correctly
- [ ] Focus check: 3px ring visible when tabbed to
- [ ] TypeScript: `npx tsc --noEmit` passes
- [ ] ESLint: No new lint errors

### After All 4 Fixes
```bash
# 1. Run E2E accessibility tests
cd frontend && npx playwright test a11y

# 2. Run Lighthouse audit
npx lighthouse http://localhost/dashboard --view

# 3. Verify with screen reader (optional)
# - VoiceOver (Mac) or NVDA (Windows)
# - Tab to each button
# - Verify aria-label is announced
```

### Expected Results
- All E2E a11y tests pass ✓
- Lighthouse accessibility score: 95+ ✓
- No console warnings about missing labels ✓
- WCAG 2.1 AA compliance: 100% ✓

---

## Prevention: Add Linting Rule

To prevent future violations, consider adding to `.eslintrc`:

```javascript
{
  "rules": {
    // Enforce aria-label on icon buttons
    "jsx-a11y/button-has-type": "error",
    "jsx-a11y/no-static-element-interactions": "error",
    "jsx-a11y/click-events-have-key-events": "error",
  }
}
```

Or create custom rule:
```javascript
// frontend/eslint-local-rules/icon-button-needs-label.js
module.exports = {
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.name === 'Button' || node.name.name === 'button') {
          const hasSize = node.attributes.some(attr =>
            attr.name?.name === 'size' && attr.value?.value === 'icon'
          );
          const hasLabel = node.attributes.some(attr =>
            attr.name?.name === 'aria-label'
          );
          if (hasSize && !hasLabel) {
            context.report({
              node,
              message: 'Icon buttons must have aria-label'
            });
          }
        }
      }
    };
  }
};
```

---

## Timeline

| Task | Time | Who | Status |
|------|------|-----|--------|
| Fix JobsTable | 2 min | UX/Frontend | Ready |
| Fix RulePerformanceTable | 2 min | UX/Frontend | Ready |
| Fix RuleConditionInput | 2 min | UX/Frontend | Ready |
| Fix TopicsPage | 2 min | UX/Frontend | Ready |
| Test & verify | 5 min | UX/Frontend | Ready |
| **TOTAL** | **~15 min** | - | - |

---

## Git Workflow

```bash
# 1. Create branch
git checkout -b fix/a11y-icon-buttons

# 2. Make all 4 fixes
# (follow the changes above for each file)

# 3. Verify locally
cd frontend
npx tsc --noEmit
npm run test:a11y

# 4. Commit
git add .
git commit -m "fix(a11y): add missing aria-labels to icon buttons

- JobsTable.tsx: Add aria-label to dropdown trigger
- RulePerformanceTable.tsx: Add aria-label to dropdown trigger
- RuleConditionInput.tsx: Add aria-label to remove button
- TopicsPage.tsx: Add aria-label to clear search button

Fixes WCAG 2.1 AA violations (criterion 2.4.4 Link Purpose)"

# 5. Push & create PR
git push origin fix/a11y-icon-buttons
```

---

## Notes

- All fixes are **backwards compatible** (adding aria-label doesn't break existing code)
- No dependencies need to be updated
- No styling changes required
- Can be tested with any screen reader (NVDA, JAWS, VoiceOver)
- Fixes ensure compliance with WCAG 2.1 Level AA standard

---

**Target**: Complete all fixes before next accessibility audit
**Deadline**: End of sprint
**Owner**: Frontend team
