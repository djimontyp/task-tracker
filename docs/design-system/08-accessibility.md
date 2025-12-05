# Accessibility: WCAG 2.1 AA Compliance

## Baseline: WCAG 2.1 Level AA

Pulse Radar targets **WCAG 2.1 Level AA** compliance by default. All components are designed with accessibility as foundation, not afterthought.

---

## Contrast Ratio Requirements

### Text Color Contrast

| Context | Minimum | WCAG Level | Pulse Radar |
|---------|---------|-----------|-----------|
| **Normal text (≥18px)** | 4.5:1 | AA | 5+:1 ✓ |
| **Large text (<18px)** | 4.5:1 | AA | 5+:1 ✓ |
| **UI components** | 3:1 | AA | 4.5:1 ✓ |
| **Focus indicators** | 3:1 | AA | 4.5+:1 ✓ |

### Testing Contrast

**WebAIM Contrast Checker:**
```
https://webaim.org/resources/contrastchecker/
Enter foreground and background colors → Shows ratio
```

**Browser DevTools:**
1. Right-click element → Inspect
2. In Styles panel, click color swatch
3. Check "Contrast ratio" section

### Pulse Radar Color Combinations

| Text | Background | Ratio | Status |
|------|-----------|-------|--------|
| foreground (near-black) | background (white) | 21:1 | ✅ AAA |
| muted-foreground | background (white) | 4.8:1 | ✅ AA |
| primary (orange) | background (white) | 4.8:1 | ✅ AA |
| destructive (red) | background (white) | 5.8:1 | ✅ AAA |
| white text | primary (orange) | 4.8:1 | ✅ AA |
| white text | destructive (red) | 5.8:1 | ✅ AAA |

**Non-compliant (DON'T USE):**
- ❌ info (blue) + white text = 3.2:1 (fails AA)
- ❌ muted text on muted bg = 1.3:1 (fails)
- ❌ light text on white = 1.0:1 (fails)

---

## Focus Indicators

### WCAG 2.4.7: Visible Focus Indicator

**Requirement:** Focus indicator visible and distinguishable on all backgrounds.

### Pulse Radar Focus Style

```css
/* Global focus style (index.css) */
:where(button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])):focus-visible {
  outline: 3px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

**Visual Properties:**
- **Width:** 3px (exceeds 2px minimum)
- **Style:** solid outline (not box-shadow)
- **Color:** primary orange (high contrast)
- **Offset:** 2px from element edge
- **Visibility:** On all backgrounds (contrast ≥3:1)

### Focus Testing

```jsx
// Test keyboard focus
1. Page load
2. Press Tab key repeatedly
3. Verify outline visible on all elements
4. Verify outline width at least 2px
5. Verify color contrast ≥3:1
6. Verify outline doesn't obscure element content
```

### Don't Disable Focus

❌ **NEVER do this:**
```css
/* WRONG — removes accessibility for keyboard users */
button:focus {
  outline: none;
}
```

✅ **ALWAYS keep focus:**
```css
/* CORRECT — focus visible from global styles */
button:focus-visible {
  outline: 3px solid hsl(var(--ring));
}
```

---

## Touch Target Size (WCAG 2.5.5)

### Requirement: 44×44 CSS Pixels

All interactive elements must be at least 44×44px (both width and height).

### Pulse Radar Touch Targets

| Element | Size | CSS Class | Status |
|---------|------|-----------|--------|
| **Button (default)** | 36×44px | `h-9 px-4` | ⚠️ Height 36px |
| **Button (icon)** | 44×44px | `h-11 w-11` | ✅ 44×44px |
| **Input field** | 36×full | `h-9 px-3` | ⚠️ Height 36px |
| **Sidebar item** | 36×full | `h-9` | ⚠️ Height 36px |
| **Checkbox** | 20×20px | Built-in | ⚠️ Small, needs label |
| **Switch** | 20×32px | Built-in | ⚠️ Small, needs label |

**Minimum:** 44×44px for finger/cursor targeting

**Acceptable:** Smaller if associated with large label (e.g., checkbox + label = 44px total height)

### Improving Touch Targets

```jsx
// Option 1: Increase button height
<Button className="h-11">Full Size</Button>  // 44px height

// Option 2: Icon button
<Button size="icon" className="h-11 w-11" />  // 44×44px

// Option 3: Increase label area
<label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-muted">
  <Checkbox id="agree" />
  <span>I agree to terms</span>
</label>
{/* Total clickable area: 44px+ */}
```

### Touch Target Spacing

**Requirement:** ≥8px gap between touch targets to prevent mis-taps.

```jsx
// ✅ CORRECT — 8px gap
<div className="flex gap-2">
  <Button size="icon" className="h-11 w-11">A</Button>
  <Button size="icon" className="h-11 w-11">B</Button>
</div>
// 44px + 8px gap + 44px = safe spacing

// ❌ WRONG — too close
<div className="flex gap-0">
  <Button size="icon">A</Button>
  <Button size="icon">B</Button>
</div>
```

---

## Keyboard Navigation

### WCAG 2.1.1: Keyboard Accessible

All functionality must be operable via keyboard.

### Tab Navigation

```jsx
// Natural tab order (HTML order)
<form>
  <input />        {/* Tab 1 */}
  <input />        {/* Tab 2 */}
  <button>Save</button>  {/* Tab 3 */}
</form>

// DON'T reorder with tabindex
<input tabIndex={5} />   // Breaks natural order
```

### Keyboard Keys

| Key | Function | Element |
|-----|----------|---------|
| **Tab** | Move focus forward | All interactive |
| **Shift+Tab** | Move focus backward | All interactive |
| **Enter** | Activate button, submit form | Button, form |
| **Space** | Activate button, toggle checkbox | Button, checkbox, switch |
| **Escape** | Close modal, cancel form | Dialog, sheet |
| **Arrow keys** | Navigate options | Select, menu, tabs |
| **Delete** | Remove item | Item-specific |

### Testing Keyboard Navigation

```
1. Disconnect mouse
2. Press Tab → Tab → Tab... navigate entire page
3. Press Shift+Tab → Navigate backward
4. Press Enter/Space to activate buttons
5. Press Escape to close dialogs
6. Verify visible focus indicator at every step
```

---

## Semantic HTML

### Use Correct Elements

| Content | Element | NOT |
|---------|---------|-----|
| **Navigation** | `<nav>` | `<div className="nav">` |
| **Main content** | `<main>` | `<div id="main">` |
| **Section** | `<section>` | `<div>` (if heading follows) |
| **Aside** | `<aside>` | `<div className="sidebar">` |
| **Button action** | `<button>` | `<div onClick={}>` |
| **Link navigation** | `<a href="">` | `<span onClick={}>` |
| **Form input** | `<input>` | `<div contenteditable>` |
| **Form label** | `<label htmlFor="">` | `<span>` |
| **Heading** | `<h1>`, `<h2>`, etc. | `<span className="bold">` |

### Why Semantic HTML?

- Screen readers announce element type
- Keyboard navigation works automatically
- Search engines understand structure
- Browser features work (form submission, link context menu)

### Example: Semantic Form

```jsx
// ✅ CORRECT
<form onSubmit={handleSubmit}>
  <div className="space-y-4">
    <div>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" required />
    </div>
    <button type="submit">Send</button>
  </div>
</form>

// ❌ WRONG
<div onClick={handleSubmit}>
  <span>Email</span>
  <div contentEditable>Email input</div>
  <div onClick={submit}>Send</div>
</div>
```

---

## ARIA Labels & Roles

### When to Use ARIA

Only use ARIA when semantic HTML insufficient.

| Scenario | Solution |
|----------|----------|
| **Icon-only button** | `aria-label="Description"` |
| **Toolbar with roles** | `role="toolbar"` + child roles |
| **Custom listbox** | `role="listbox"` + `role="option"` |
| **Status indicator** | `aria-label="Status: Online"` |
| **Form error** | `aria-describedby="error-msg"` |

### ARIA Label Examples

```jsx
// Icon button requires label
<Button size="icon" aria-label="Delete item">
  <Trash className="h-4 w-4" />
</Button>

// Form validation
<input
  aria-invalid={hasError}
  aria-describedby={hasError ? 'error-id' : undefined}
/>
{hasError && <span id="error-id">{error}</span>}

// Status indicator
<span role="status" aria-label="3 new messages">
  <Badge>3</Badge>
</span>

// Skip link
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### ARIA Best Practices

- ✅ Use `aria-label` for icon-only buttons
- ✅ Use `aria-describedby` to relate error messages
- ✅ Use `aria-invalid` for form errors
- ✅ Use `role="status"` for live regions (notifications)
- ✅ Use `aria-expanded` for collapsible sections
- ❌ Don't use ARIA instead of semantic HTML
- ❌ Don't over-use ARIA (screen readers prefer semantic HTML)
- ❌ Don't create redundant labels (aria-label + visible text)

---

## Color & Visual Indicators

### WCAG 1.4.1: Use of Color

Do not convey information through color alone.

❌ **WRONG — Color only:**
```jsx
<span className="h-3 w-3 rounded-full bg-green-500" />
// User with color blindness sees just a dot
```

✅ **CORRECT — Color + Icon + Text:**
```jsx
<div className="flex items-center gap-2">
  <CheckCircle className="h-4 w-4 text-green-600" />
  <span>Connected</span>
</div>
```

### Examples

| Status | Color | Icon | Text |
|--------|-------|------|------|
| **Connected** | Green | ✓ Checkmark | "Connected" |
| **Error** | Red | ✗ X mark | "Error" |
| **Warning** | Yellow | ⚠️ Alert | "Warning" |
| **Loading** | Blue | ⟳ Spinner | "Loading..." |

---

## Color Blindness Simulation

### Tools to Test

**Color Oracle:** http://colororacle.org/
- Simulates protanopia (red-blind)
- Simulates deuteranopia (green-blind)
- Simulates tritanopia (blue-blind)

**WebAIM Color Contrast Checker:**
https://webaim.org/resources/contrastchecker/
- Test specific color pairs

**Browser DevTools:**
1. F12 → Rendering
2. Scroll to "Emulate CSS media feature prefers-color-scheme"
3. Test all colors visible

### Pulse Radar Color Symbols

| Color | Symbol | Use |
|-------|--------|-----|
| Red | ✕ X | Error, delete, stop |
| Green | ✓ Check | Success, approved, connected |
| Yellow | ⚠️ Alert | Warning, caution, pending |
| Blue | ◆ Diamond | Info, decision, decision-making |
| Orange | ! Exclamation | Action, important, prompt |
| Purple | 💡 Lightbulb | Insight, idea, learning |

---

## Reduced Motion Support

### WCAG 2.3.3: Animation from Interactions

Respect user preferences for motion.

**Global support (index.css):**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Component level:**
```jsx
<div className="animate-fade-in motion-reduce:animate-none">
  Content
</div>
```

**Testing:**
1. DevTools → Rendering → Emulate "prefers-reduced-motion: reduce"
2. All animations should be instant
3. Content should still be accessible

---

## Form Accessibility

### WCAG 1.3.1: Info & Relationships

Form fields must be associated with labels.

```jsx
// ✅ CORRECT
<div>
  <label htmlFor="email">Email Address</label>
  <input id="email" type="email" />
</div>

// ❌ WRONG — No association
<div>
  <label>Email Address</label>
  <input type="email" />
</div>
```

### Error Messages

```jsx
// ✅ CORRECT — Error programmatically related
<input
  id="email"
  aria-invalid={hasError}
  aria-describedby="email-error"
/>
{hasError && (
  <span id="email-error" className="text-xs text-destructive">
    Please enter a valid email
  </span>
)}

// ❌ WRONG — Error not associated
<input id="email" />
<span className="text-red-500">Invalid email</span>
```

### Required Fields

```jsx
// ✅ CORRECT — Required indicated via attribute AND text
<label htmlFor="name">
  Name <span aria-label="required">*</span>
</label>
<input id="name" required />

// ❌ WRONG — Only color indicates required
<label>Name <span className="text-red-500">*</span></label>
```

---

## Image & Icon Accessibility

### WCAG 1.1.1: Non-text Content

All images need alternative text.

```jsx
// ✅ CORRECT — Image with alt text
<img src="logo.png" alt="Pulse Radar logo" />

// ✅ CORRECT — Decorative image
<img src="decoration.png" alt="" aria-hidden="true" />

// ✅ CORRECT — Icon with label
<Button aria-label="Delete item">
  <Trash />
</Button>

// ❌ WRONG — No alt text
<img src="logo.png" />

// ❌ WRONG — Redundant label
<Button aria-label="Delete" title="Delete">
  <Trash />
</Button>
```

---

## Testing Accessibility

### Browser Extensions

- **Axe DevTools** — Automated testing
- **WAVE** — Visual feedback
- **Lighthouse** — Built into DevTools
- **Pa11y** — CLI tool

### Manual Testing Checklist

- [ ] **Keyboard navigation:** Tab through entire page
- [ ] **Focus visible:** 3px ring on all focusable elements
- [ ] **Color contrast:** All text ≥4.5:1 on background
- [ ] **Touch targets:** All buttons ≥44×44px
- [ ] **Form labels:** All inputs have associated labels
- [ ] **Error messages:** Visible, color + icon/text
- [ ] **Alt text:** All images have meaningful alt text
- [ ] **Reduced motion:** Animations disabled when preference set
- [ ] **Dark mode:** All colors still meet contrast
- [ ] **Screen reader:** Test with NVDA/JAWS if possible

### Automated Testing

```bash
# Run accessibility tests
npm run test:a11y

# Or with Axe
npx axe https://localhost:3000
```

---

## Accessibility Checklist

- [ ] All text ≥4.5:1 contrast (4.5:1 AA, 7:1 AAA)
- [ ] Focus indicator visible (3px ring, ≥3:1 contrast)
- [ ] Touch targets ≥44×44px (WCAG 2.5.5)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Semantic HTML used (nav, main, section, form, etc.)
- [ ] Form labels associated via htmlFor
- [ ] Error messages visible and related (aria-describedby)
- [ ] Icons have aria-labels (if not redundant)
- [ ] Color not sole indicator (color + icon + text)
- [ ] Reduced motion respected (prefers-reduced-motion)
- [ ] Dark mode contrast checked
- [ ] Screen reader compatible (tested if possible)

---

## Resources

- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM:** https://webaim.org/
- **Axe DevTools:** https://www.deque.com/axe/devtools/
- **A11y Project:** https://www.a11yproject.com/
- **MDN Accessibility:** https://developer.mozilla.org/en-US/docs/Web/Accessibility

