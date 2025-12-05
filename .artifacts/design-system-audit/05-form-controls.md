# Form Controls Audit — Component Analysis

**Дата:** 2025-12-05
**Агент:** Agent 2.2 (Form Controls Audit)
**Scope:** Input, Textarea, Select, Checkbox, Switch, Radio Group, FormField pattern

---

## Executive Summary

### ✅ Сильні сторони

1. **Radix UI Foundation** — Всі компоненти базуються на Radix UI primitives (accessibility out-of-the-box)
2. **Comprehensive Storybook** — 40+ stories покривають всі варіанти та стани
3. **Design System Documentation** — Чіткі правила в кожному story (WCAG, touch targets, spacing)
4. **FormField Pattern** — Готовий wrapper з label, error, description (TypeScript tokens)
5. **Consistent Height** — Всі inputs h-9 (36px) для WCAG 2.5.5 compliance

### ❌ Критичні проблеми

1. **Focus Ring Inconsistency** — 3 різні реалізації focus state
2. **Missing States** — Відсутні loading, readonly indicators (крім Input)
3. **API Inconsistency** — Різні підходи до error/validation states
4. **Spacing Violations** — `gap-2.5` (10px) замість 8px/12px в Checkbox/Switch stories
5. **Missing Unified Pattern** — FormField не використовується в Storybook examples

---

## 1. Focus Ring Analysis

### 🔴 КРИТИЧНО: Три різні реалізації

| Component | Focus Implementation | Ring Width | Offset |
|-----------|---------------------|------------|--------|
| **Input** | `focus-visible:ring-1 focus-visible:ring-primary/80` | 1px | 0 |
| **Textarea** | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` | 2px | 2px |
| **Select** | `focus:ring-1 focus:ring-ring` | 1px | 0 |
| **Checkbox** | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` | 2px | 2px |
| **Switch** | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` | 2px | 2px |
| **Radio** | `focus-visible:ring-1 focus-visible:ring-ring` | 1px | 0 |

**Проблеми:**

1. **Input uses `primary/80`** (80% opacity blue) vs **Others use `ring`** (semantic focus color)
2. **Textarea/Checkbox/Switch** мають 2px offset → відстань між border та focus ring
3. **Input/Select/Radio** без offset → focus ring прилягає до border
4. **Select uses `focus:`** замість `focus-visible:` → спрацьовує на mouse click (не WCAG)

### ✅ Рекомендація

**Unified Focus Pattern:**
```tsx
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-0  // Без offset — чіткіший індикатор
```

**Rationale:**
- `ring-2` (2px) — достатньо помітний для WCAG 2.4.7 (Focus Visible)
- `ring-ring` — semantic token (не hardcoded primary)
- `ring-offset-0` — immediate feedback, no gap
- `focus-visible` — тільки для keyboard navigation

---

## 2. Component-by-Component Analysis

### 2.1 Input

**Файл:** `frontend/src/shared/ui/input.tsx`

**API:**
```tsx
interface InputProps extends React.ComponentProps<"input"> {
  // Standard HTML attributes only
}
```

**Focus State:**
```tsx
className="focus-visible:ring-1 focus-visible:ring-primary/80 focus-visible:ring-offset-0"
```

**States Covered:**
- ✅ Default, Disabled, ReadOnly, Required, Error
- ✅ With Icons (leading/trailing)
- ✅ File upload
- ❌ Loading state (missing)

**Height:** `h-9` (36px) ✅ WCAG compliant

**Storybook:** 13 stories (comprehensive coverage)

**Проблеми:**

1. **Focus uses `primary/80`** → має бути `ring` token
2. **Error state manual** — потребує `className="border-destructive focus-visible:ring-destructive"`
3. **No built-in loading indicator** (spinner inside input)
4. **Spacing inconsistency:** Stories використовують `gap-2` (8px) ✅ але FormField pattern uses `gap-2.5` (10px) ❌

---

### 2.2 Textarea

**Файл:** `frontend/src/shared/ui/textarea.tsx`

**API:**
```tsx
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
```

**Focus State:**
```tsx
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

**States Covered:**
- ✅ Default, Disabled, Required, Error
- ❌ ReadOnly (missing story)
- ❌ Loading/Saving indicator (missing)
- ❌ Character count (common pattern, missing)

**Min Height:** `min-h-[80px]` ✅

**Storybook:** 8 stories

**Проблеми:**

1. **Offset 2px** — відрізняється від Input (0px)
2. **ReadOnly state** не показаний в Storybook
3. **Missing character counter pattern** (common in forms)
4. **No auto-resize variant** (grow with content)

---

### 2.3 Select

**Файл:** `frontend/src/shared/ui/select.tsx`

**API:**
```tsx
// Compound component pattern (Radix)
<Select>
  <SelectTrigger />
  <SelectContent>
    <SelectItem />
  </SelectContent>
</Select>
```

**Focus State (Trigger):**
```tsx
className="focus:ring-1 focus:ring-ring"
```

**🔴 КРИТИЧНО:** Uses `focus:` замість `focus-visible:` → спрацьовує на mouse click

**States Covered:**
- ✅ Default, Disabled, With Groups, With Separators
- ✅ Disabled Option
- ❌ Loading state (fetching options)
- ❌ Error state (invalid selection)
- ❌ Multi-select (not supported by Radix Select)

**Height:** `h-9` (36px) ✅

**Storybook:** 7 stories

**Проблеми:**

1. **`focus:` замість `focus-visible:`** → WCAG порушення
2. **No error variant** (червона border як в Input)
3. **No loading state** (skeleton або spinner в dropdown)
4. **SelectItem focus color** — `focus:bg-accent` (не перевірено чи достатній contrast)

---

### 2.4 Checkbox

**Файл:** `frontend/src/shared/ui/checkbox.tsx`

**API:**
```tsx
// Radix primitive wrapper
interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {}
```

**Focus State:**
```tsx
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

**Size:** `h-4 w-4` (16px) → потребує обгортки для 44px touch target ✅ (stories використовують Label)

**States Covered:**
- ✅ Default, Checked, Disabled, DisabledChecked, Required
- ✅ With Label, With Description
- ❌ Indeterminate state (missing story, але Radix підтримує)
- ❌ Error state (invalid checkbox)

**Storybook:** 7 stories

**Проблеми:**

1. **Spacing violation в stories:**
   ```tsx
   // ❌ gap-2.5 (10px) замість 8px/12px
   <div className="grid gap-2.5 leading-none">
   ```
2. **Indeterminate state** не показаний (Radix підтримує `checked="indeterminate"`)
3. **Touch target pattern** розкиданий по stories → має бути в design docs
4. **`cursor-pointer` на Label** — добре для UX, але не документовано як обов'язкове

---

### 2.5 Switch

**Файл:** `frontend/src/shared/ui/switch.tsx`

**API:**
```tsx
// Radix primitive wrapper
interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {}
```

**Focus State:**
```tsx
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

**Size:** `h-5 w-9` (20x36px) → потребує обгортки для 44px touch target ✅

**States Covered:**
- ✅ Default, Checked, Disabled, DisabledChecked
- ✅ With Label, With Description
- ❌ Loading state (переключення з затримкою API call)

**Storybook:** 8 stories

**Проблеми:**

1. **Spacing violations:**
   ```tsx
   // ❌ space-y-0.5 (2px) — занадто мало між label та description
   <div className="space-y-0.5">
   ```
2. **No loading state** (spinner під час API call)
3. **No "processing" visual** (коли очікується async result)
4. **SettingsList pattern** використовує `py-4` (16px) → має бути documented pattern

---

### 2.6 Radio Group

**Файл:** `frontend/src/shared/ui/radio-group.tsx`

**API:**
```tsx
<RadioGroup>  // Container
  <RadioGroupItem />  // Individual radio
</RadioGroup>
```

**Focus State:**
```tsx
className="focus-visible:ring-1 focus-visible:ring-ring"
```

**Size:** `h-4 w-4` (16px) → потребує обгортки для 44px touch target

**States Covered:**
- ✅ Default, Disabled
- ✅ Horizontal/Vertical layouts
- ❌ Error state (invalid selection)
- ❌ Required indicator

**Storybook:** 6 stories

**Проблеми:**

1. **Ring width 1px** (менше за інші controls)
2. **No offset** (0px)
3. **Missing error variant** (червона border)
4. **RadioGroup grid gap-2** (8px) — консистентно, але horizontal variant використовує `flex space-x-4` (16px) — inconsistency

---

### 2.7 FormField Pattern

**Файл:** `frontend/src/shared/patterns/FormField.tsx`

**API:**
```tsx
<FormField
  label="Email"
  error={errors.email?.message}
  required
  description="Helper text"
>
  <Input {...register('email')} />
</FormField>
```

**Variants:**
- `FormField` — default (label above)
- `InlineFormField` — label beside input
- `FormSection` — grouped fields
- `FormActions` — button container
- `Fieldset` — bordered group

**TypeScript Tokens:**
```tsx
import { forms } from '@/shared/tokens';

forms.field        // "grid gap-2"
forms.label.default
forms.label.required
forms.error
forms.help
forms.section
```

**Проблеми:**

1. **Not used in Storybook examples** → Stories показують manual markup замість FormField
2. **Spacing `gap-2.5` в code:**
   ```tsx
   // FormField.tsx line 147
   <div className="grid gap-2.5 leading-none">  // ❌ 10px
   ```
3. **`forms.field = "grid gap-2"`** (8px) але реальний код використовує `gap-2.5` → mismatch
4. **Error styling через `[&>*]` selector** — fragile (може зламатися при nested structure)

---

## 3. API Consistency Matrix

| Feature | Input | Textarea | Select | Checkbox | Switch | Radio |
|---------|-------|----------|--------|----------|--------|-------|
| **disabled** prop | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **required** prop | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **readOnly** prop | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **error** variant | Manual | Manual | ❌ | ❌ | ❌ | ❌ |
| **aria-invalid** | ✅ Story | ❌ | ❌ | ❌ | ❌ | ❌ |
| **aria-describedby** | ✅ Story | ❌ | ❌ | ❌ | ❌ | ❌ |
| **loading** state | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **FormField** integration | ✅ Works | ✅ Works | ✅ Works | ⚠️ Manual | ⚠️ Manual | ⚠️ Manual |

**Legend:**
- ✅ Supported natively
- ⚠️ Works but not documented
- ❌ Missing
- Manual — requires className override

---

## 4. Visual Inconsistencies

### 4.1 Spacing Violations

**Design System Rule:** Кратні 4px (gap-2=8px, gap-3=12px, gap-4=16px)

**Порушення:**

1. **FormField.tsx line 147, 183:**
   ```tsx
   <div className="grid gap-2.5 leading-none">  // ❌ 10px
   ```

2. **Checkbox stories line 147:**
   ```tsx
   <div className="grid gap-2.5 leading-none">  // ❌ 10px
   ```

3. **Switch stories line 160, 216:**
   ```tsx
   <div className="space-y-0.5">  // ❌ 2px (занадто мало)
   ```

**Impact:** Візуальна неконсистентність між формами в різних частинах додатку.

---

### 4.2 Focus Ring Відмінності

**Візуально це виглядає так:**

- **Input:** тонке синє кільце (1px, 80% opacity) прилягає до border
- **Textarea:** товсте сіре кільце (2px) з 2px відступом → виглядає "відірваним"
- **Select:** тонке сіре кільце (1px) прилягає до border
- **Checkbox/Switch:** товсте сіре кільце (2px) з відступом

**User Experience Impact:**
Користувач при Tab navigation бачить 4 різні focus indicators → заплутаність, непрофесійний вигляд.

---

### 4.3 Error State Patterns

**Input Error (manual):**
```tsx
<Input
  className="border-destructive focus-visible:ring-destructive"
  aria-invalid="true"
/>
<p className="text-sm text-destructive">Error message</p>
```

**FormField Error (automatic):**
```tsx
<FormField error="Error message">
  <Input {...register('email')} />
</FormField>
// Auto-applies border-destructive через [&>*] selector
```

**Проблема:** Два різні підходи — manual vs automatic. FormField selector fragile.

---

## 5. Missing States

### 5.1 Loading States

**Use Cases:**

1. **Input Loading** — search autocomplete (spinner inside input)
2. **Select Loading** — fetching options (skeleton в dropdown)
3. **Switch Loading** — async toggle (disabled + spinner)
4. **Form Submitting** — all controls disabled + spinner on submit button

**Current Status:** ❌ Жодного компонента не має loading variant

**Recommendation:**
```tsx
// Input with loading
<Input
  loading={isSearching}
  leadingIcon={isSearching ? <Spinner /> : <SearchIcon />}
/>

// Switch with loading
<Switch
  loading={isSaving}
  disabled={isSaving}
  className={isSaving && "opacity-50"}
/>
```

---

### 5.2 Readonly States

**Current Coverage:**
- ✅ Input — `readOnly` prop works
- ✅ Textarea — `readOnly` prop works
- ❌ Select — no readonly variant (Radix limitation)
- ❌ Checkbox/Switch — no readonly (тільки disabled)

**Visual Gap:** Readonly має виглядати інакше ніж disabled (not grayed out, просто non-interactive)

**Recommendation:**
```tsx
// Readonly styling (not grayed out)
className={cn(
  readOnly && "cursor-default bg-muted/50"
)}
```

---

### 5.3 Indeterminate Checkbox

**Radix Support:** ✅ `checked="indeterminate"`
**Storybook Coverage:** ❌ Missing story

**Use Case:** "Select All" checkbox коли вибрано частину items

**Recommendation:** Add story + document pattern

---

## 6. Accessibility Gaps

### 6.1 Focus States

**WCAG 2.4.7 (Focus Visible):**
- ✅ Всі компоненти мають focus ring
- ❌ Select використовує `focus:` замість `focus-visible:` → спрацьовує на mouse click
- ❌ Різні реалізації → непередбачувана поведінка

**Fix Priority:** 🔴 Critical

---

### 6.2 Error Announcements

**WCAG 4.1.3 (Status Messages):**

**Current:**
- ✅ Input story має `aria-invalid` + `aria-describedby`
- ❌ Інші компоненти без ARIA error patterns
- ❌ No `role="alert"` на error messages

**Recommendation:**
```tsx
{error && (
  <p
    id={`${id}-error`}
    className="text-sm text-destructive"
    role="alert"  // ← ARIA live region
  >
    {error}
  </p>
)}

<Input
  aria-invalid={!!error}
  aria-describedby={error ? `${id}-error` : undefined}
/>
```

---

### 6.3 Touch Targets

**WCAG 2.5.5 (Target Size):**

**Current:**
- ✅ Input/Textarea/Select — h-9 (36px) ✅ compliant
- ⚠️ Checkbox/Switch/Radio — 16-20px wrapper → потребують Label обгортки
- ✅ Stories показують правильні patterns
- ❌ Documentation не наголошує на обов'язковості

**Gap:** Developers можуть пропустити Label обгортку → 16px touch target ❌

---

## 7. Storybook Coverage Analysis

### 7.1 Story Count

| Component | Stories | Coverage |
|-----------|---------|----------|
| Input | 13 | ✅ Excellent |
| Textarea | 8 | ⚠️ Good (missing readonly, char count) |
| Select | 7 | ⚠️ Good (missing error, loading) |
| Checkbox | 7 | ⚠️ Good (missing indeterminate) |
| Switch | 8 | ⚠️ Good (missing loading) |
| Radio | 6 | ⚠️ Fair (missing error, required) |

**Total:** 49 stories

---

### 7.2 Missing Stories

1. **Textarea:**
   - ReadOnly state
   - Character counter (e.g., "120/500")
   - Auto-resize variant

2. **Select:**
   - Error state (червона border)
   - Loading state (fetching options)
   - Empty state (no options available)

3. **Checkbox:**
   - Indeterminate state
   - Error state (invalid checkbox)

4. **Switch:**
   - Loading/Processing state
   - Async toggle with rollback on error

5. **Radio:**
   - Error state
   - Required indicator
   - Horizontal layout with equal spacing

6. **All Controls:**
   - FormField integration examples (показати як використовувати разом)

---

## 8. FormField Pattern Integration

### 8.1 Current Usage

**FormField існує** (`frontend/src/shared/patterns/FormField.tsx`) але:
- ❌ **Not used in Storybook** — Stories показують manual markup
- ❌ **Not documented in Design System** — немає в docs/design-system/
- ⚠️ **Works but undiscovered** — Developers не знають про існування

**Example:**

Storybook Input story (manual):
```tsx
<div className="grid w-full max-w-sm items-center gap-2">
  <Label htmlFor="email">Email</Label>
  <Input type="email" id="email" placeholder="Email" />
</div>
```

FormField pattern (automatic):
```tsx
<FormField label="Email" id="email">
  <Input type="email" placeholder="Email" />
</FormField>
```

---

### 8.2 Integration Gap

**Problem:** Checkbox/Switch stories використовують:
```tsx
<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms</Label>
</div>
```

**FormField не підходить** для inline controls (checkbox/switch поруч з label).

**Solution:** Потрібен `InlineFormField` variant (вже існує!) але не documented.

---

## 9. Recommendations

### 9.1 Critical Fixes (Week 1)

**P0 — Immediate:**

1. **Unified Focus Ring** — Update всі компоненти:
   ```tsx
   focus-visible:outline-none
   focus-visible:ring-2
   focus-visible:ring-ring
   focus-visible:ring-offset-0
   ```

2. **Select Focus Fix** — Замінити `focus:` на `focus-visible:`

3. **Spacing Violations** — Fix `gap-2.5` → `gap-2` (8px) або `gap-3` (12px)

4. **FormField Docs** — Add to Design System docs з examples

---

### 9.2 High Priority (Week 2)

**P1 — Important:**

1. **Error States API** — Add built-in error support:
   ```tsx
   <Input error="Invalid email" />
   <Select error="Required field" />
   ```

2. **Loading States** — Add loading variants:
   ```tsx
   <Input loading={isSearching} />
   <Switch loading={isSaving} />
   ```

3. **Missing Storybook Stories:**
   - Textarea: ReadOnly, CharCounter
   - Select: Error, Loading
   - Checkbox: Indeterminate
   - All: FormField integration examples

4. **ARIA Improvements:**
   - Add `role="alert"` to error messages
   - Document `aria-invalid` pattern
   - Add `aria-describedby` to all error examples

---

### 9.3 Medium Priority (Week 3-4)

**P2 — Nice to Have:**

1. **Readonly Visual States** — Distinguish from disabled

2. **Character Counter Component** — For Textarea

3. **Auto-resize Textarea** — Grow with content

4. **Multi-select Component** — Separate from Select (use Combobox)

5. **Form Validation Patterns** — Document react-hook-form + Zod integration

---

### 9.4 Long-term Improvements

**P3 — Future:**

1. **Focus Trap Utilities** — For modal forms

2. **Form State Indicators** — Dirty, touched, submitting badges

3. **Accessibility Testing** — Automated tests з axe-core

4. **Visual Regression Tests** — Chromatic для focus states

---

## 10. Code Examples

### 10.1 Unified Focus Ring

**File to Update:** `frontend/src/shared/ui/*.tsx`

**Before:**
```tsx
// input.tsx
className="focus-visible:ring-1 focus-visible:ring-primary/80"

// textarea.tsx
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

// select.tsx
className="focus:ring-1 focus:ring-ring"
```

**After:**
```tsx
// All components
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
```

---

### 10.2 Error State API

**New Pattern:**

```tsx
// input.tsx
export interface InputProps extends React.ComponentProps<"input"> {
  error?: string | boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        className={cn(
          "flex h-9 w-full rounded-md border border-input...",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        aria-invalid={error ? "true" : undefined}
        ref={ref}
        {...props}
      />
    )
  }
)
```

**Usage:**
```tsx
<Input error={errors.email?.message} />
```

---

### 10.3 Loading State API

```tsx
// input.tsx
export interface InputProps extends React.ComponentProps<"input"> {
  loading?: boolean;
  leadingIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, loading, leadingIcon, ...props }, ref) => {
    return (
      <div className="relative">
        {(leadingIcon || loading) && (
          <div className="absolute left-4 top-2.5">
            {loading ? <Spinner className="h-4 w-4" /> : leadingIcon}
          </div>
        )}
        <input
          className={cn(
            "flex h-9 w-full...",
            (leadingIcon || loading) && "pl-10",
            className
          )}
          disabled={loading || props.disabled}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
```

---

### 10.4 FormField Integration Story

**Add to `input.stories.tsx`:**

```tsx
import { FormField } from '@/shared/patterns/FormField';

export const WithFormField: Story = {
  render: () => {
    const [email, setEmail] = useState('');
    const error = email && !email.includes('@')
      ? 'Invalid email address'
      : undefined;

    return (
      <FormField
        label="Email"
        required
        error={error}
        description="We'll never share your email"
      >
        <Input
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormField>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Input integrated with FormField pattern. Handles label, error, and description automatically.',
      },
    },
  },
};
```

---

## 11. Testing Recommendations

### 11.1 Accessibility Tests

**Add to E2E suite:**

```typescript
// frontend/tests/e2e/a11y/forms.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Form Controls Accessibility', () => {
  test('focus rings should be visible on keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:6006/?path=/story/ui-forms-input--default');

    // Tab to input
    await page.keyboard.press('Tab');

    // Check focus ring exists
    const input = page.locator('input');
    await expect(input).toBeFocused();

    // Screenshot for visual regression
    await page.screenshot({
      path: '.artifacts/screenshots/audit/input-focus-state.png'
    });

    // Verify ring-2 class applied
    const classes = await input.getAttribute('class');
    expect(classes).toContain('focus-visible:ring-2');
  });

  test('error messages should have role="alert"', async ({ page }) => {
    await page.goto('http://localhost:6006/?path=/story/ui-forms-input--with-error');

    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText(/Please enter a valid email/);
  });

  test('checkboxes should have 44px touch target', async ({ page }) => {
    await page.goto('http://localhost:6006/?path=/story/ui-forms-checkbox--with-label');

    const label = page.locator('label');
    const box = await label.boundingBox();

    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
```

---

### 11.2 Visual Regression Tests

**Chromatic scenarios:**

1. **Focus States** — всі controls в focused state
2. **Error States** — червоні borders та messages
3. **Loading States** — spinners та disabled appearance
4. **Dark Mode** — всі variants в обох темах

---

## 12. Migration Path

### Phase 1: Quick Wins (1-2 days)

1. Update focus ring classes (global replace)
2. Fix spacing violations (gap-2.5 → gap-2)
3. Add FormField to Storybook examples
4. Document focus ring pattern in Design System

### Phase 2: API Enhancements (3-5 days)

1. Add `error` prop to all controls
2. Add `loading` prop to Input/Select/Switch
3. Create InlineFormField story examples
4. Update TypeScript interfaces

### Phase 3: Missing Features (1 week)

1. Add missing Storybook stories
2. Implement Indeterminate checkbox
3. Add Character counter component
4. Document ARIA patterns

### Phase 4: Testing (3-5 days)

1. Add E2E accessibility tests
2. Set up Chromatic visual regression
3. Document testing guidelines

---

## Conclusion

**Overall Assessment:** ⚠️ **Good Foundation, Needs Consistency Pass**

**Strengths:**
- Solid Radix UI base
- Comprehensive Storybook coverage
- Clear Design System rules documented in stories

**Critical Gaps:**
- 3 different focus ring implementations
- Missing loading states
- Spacing violations (gap-2.5)
- FormField pattern not promoted

**Recommended Action:**
Start with Phase 1 (Quick Wins) — immediate visual consistency improvement з мінімальним effort.

**Estimated Total Effort:** 2-3 weeks для повного alignment з Design System standards.

---

**Next Steps:**
1. Review цей звіт з UX team
2. Prioritize fixes based on user impact
3. Create GitHub issues для tracked work
4. Schedule E2E testing setup
