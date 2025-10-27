# Automation UX Accessibility Guidelines
**WCAG 2.1 AA Compliance for Version Management Automation**

## Executive Summary

This document defines accessibility requirements for the Automation Version Management system to ensure WCAG 2.1 Level AA compliance. All interfaces must be usable by people with disabilities, including those using:

- Screen readers (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation
- High contrast modes
- Screen magnification
- Voice control software

**Compliance Status:** Target WCAG 2.1 AA (100% compliance mandatory)

---

## WCAG 2.1 AA Compliance Checklist

### Perceivable (Information and UI components must be presentable to users)

#### 1.1 Text Alternatives
- ✅ **All icons have text labels** (via aria-label or sr-only text)
- ✅ **Charts have alt descriptions** (e.g., "Auto-approval rate: 87%, trending up 2% from last week")
- ✅ **Status indicators have text equivalents** (not color alone)
- ✅ **Form inputs have associated labels** (no placeholder-only inputs)

**Implementation:**
```tsx
// ❌ Bad: Icon without label
<TrashIcon onClick={deleteRule} />

// ✅ Good: Icon with accessible label
<button onClick={deleteRule} aria-label="Delete rule">
  <TrashIcon />
</button>

// ✅ Better: Icon with visible and accessible label
<button onClick={deleteRule}>
  <TrashIcon />
  <span>Delete</span>
</button>
```

---

#### 1.3 Adaptable
- ✅ **Semantic HTML structure** (proper heading hierarchy h1 → h2 → h3)
- ✅ **Form fields use `<label>` elements** (not just placeholder text)
- ✅ **Tables use proper markup** (`<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`)
- ✅ **Lists use `<ul>`/`<ol>` elements** (not div-based fake lists)
- ✅ **Landmarks define page regions** (`<nav>`, `<main>`, `<aside>`, `<footer>`)

**Implementation:**
```tsx
// ❌ Bad: Div soup without structure
<div className="header">Dashboard</div>
<div className="section">
  <div className="rule">Auto-approval rule</div>
</div>

// ✅ Good: Semantic structure
<header>
  <h1>Automation Dashboard</h1>
</header>
<main>
  <section aria-labelledby="active-rules">
    <h2 id="active-rules">Active Rules</h2>
    <article>
      <h3>High Confidence Auto-Approval</h3>
      {/* Rule details */}
    </article>
  </section>
</main>
```

---

#### 1.4 Distinguishable

##### 1.4.3 Contrast (Minimum) - AA
**All text must meet minimum contrast ratios:**
- **Normal text** (< 18pt or < 14pt bold): **4.5:1**
- **Large text** (≥ 18pt or ≥ 14pt bold): **3:1**
- **UI components** (buttons, form borders, focus indicators): **3:1**

**Color Palette with Contrast Ratios:**

```
On White Background (#ffffff):
✅ Gray 900 (#111827) - 18.6:1 (AAA - excellent)
✅ Gray 700 (#374151) - 11.4:1 (AAA - excellent)
✅ Gray 600 (#4b5563) - 8.6:1 (AAA - excellent)
✅ Blue 600 (#2563eb) - 7.5:1 (AAA - excellent)
✅ Green 600 (#16a34a) - 4.8:1 (AA - pass)
✅ Red 600 (#dc2626) - 5.9:1 (AA - pass)
⚠️ Yellow 500 (#eab308) - 1.9:1 (FAIL - use only for backgrounds)
❌ Gray 400 (#9ca3af) - 2.9:1 (FAIL - too light)

On Gray 900 Background (#111827):
✅ White (#ffffff) - 18.6:1 (AAA - excellent)
✅ Gray 100 (#f3f4f6) - 17.2:1 (AAA - excellent)
✅ Blue 400 (#60a5fa) - 7.9:1 (AAA - excellent)
✅ Green 400 (#4ade80) - 8.2:1 (AAA - excellent)
✅ Red 400 (#f87171) - 5.1:1 (AA - pass)
```

**Testing:** Use Chrome DevTools Lighthouse or WebAIM Contrast Checker

---

##### 1.4.11 Non-text Contrast - AA (WCAG 2.1)
**UI components and graphical objects must have 3:1 contrast:**
- Form input borders
- Button outlines
- Focus indicators
- Chart data points
- Status badges
- Graph axes

**Implementation:**
```tsx
// ✅ Button with sufficient contrast
<button className="border-2 border-gray-700">
  {/* border-gray-700 (#374151) on white = 11.4:1 */}
</button>

// ✅ Focus indicator
<input className="focus:ring-2 focus:ring-blue-600">
  {/* blue-600 (#2563eb) = 7.5:1 on white */}
</input>

// ❌ Insufficient contrast
<button className="border border-gray-300">
  {/* gray-300 (#d1d5db) on white = 1.6:1 - FAIL */}
</button>
```

---

##### 1.4.13 Content on Hover or Focus - AA (WCAG 2.1)
**Tooltips and popovers must be:**
- Dismissible (ESC key closes without moving pointer)
- Hoverable (pointer can move over tooltip without dismissing)
- Persistent (remains visible until user dismisses or removes trigger)

**Implementation:**
```tsx
// ✅ Accessible tooltip
<Tooltip content="Auto-approve if confidence ≥ 90%">
  <InfoIcon />
</Tooltip>

// Requirements:
// 1. ESC key closes tooltip
// 2. Moving mouse to tooltip keeps it open
// 3. Tooltip doesn't auto-dismiss after timeout
// 4. Focus indicator visible when keyboard-focused
```

---

### Operable (UI components and navigation must be operable)

#### 2.1 Keyboard Accessible

##### 2.1.1 Keyboard - A (applies to AA)
**All functionality available via keyboard:**
- Tab through all interactive elements
- Enter/Space activates buttons and toggles
- Arrow keys navigate within components (radio groups, sliders, dropdowns)
- ESC closes modals and dropdowns
- No keyboard traps (can always Tab out)

**Keyboard Shortcuts Map:**

```
Global Navigation:
- Tab: Next focusable element
- Shift+Tab: Previous focusable element
- Enter: Activate button/link
- Space: Toggle checkbox/switch, activate button
- ESC: Close modal/dialog/dropdown

Wizard Steps (Onboarding):
- Tab/Shift+Tab: Navigate within step
- Ctrl+→: Next step (if current step valid)
- Ctrl+←: Previous step
- ESC: Exit wizard (confirm dialog)

Rule Builder:
- Tab: Navigate between form fields
- Enter: Add condition/action row
- Shift+Delete: Remove focused condition/action row
- Ctrl+S: Save rule
- Ctrl+T: Test rule (show preview)

Condition Builder:
- Tab: Move to next field
- Space: Open dropdown (field/operator selector)
- ↑/↓: Navigate dropdown options
- Enter: Select dropdown option
- ESC: Close dropdown without selecting

Dashboard:
- Tab: Navigate chart/table
- Enter: View details
- ↑/↓/←/→: Navigate chart data points (when focused)

Tables (Execution Log, Rule Performance):
- Tab: Enter table, focus first cell
- ↑/↓: Navigate rows
- ←/→: Navigate columns
- Enter: Activate row action (view details)
- Home: First column
- End: Last column
- Ctrl+Home: First row, first column
- Ctrl+End: Last row, last column

Modals/Dialogs:
- Tab: Cycle through focusable elements (trapped within modal)
- ESC: Close modal
- Enter: Confirm action (if focus on confirm button)
```

**Implementation:**
```tsx
// ✅ Keyboard-accessible custom dropdown
<div role="combobox" aria-expanded={isOpen} aria-controls="rule-actions">
  <button
    onClick={() => setIsOpen(!isOpen)}
    onKeyDown={(e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        // Focus first option
      }
    }}
  >
    {selectedAction || 'Select action'}
  </button>
  {isOpen && (
    <ul id="rule-actions" role="listbox">
      <li role="option" tabIndex={0}>Approve</li>
      <li role="option" tabIndex={0}>Reject</li>
    </ul>
  )}
</div>
```

---

##### 2.1.2 No Keyboard Trap - A (applies to AA)
**Users can navigate away from all components:**
- Modal focus trap allows ESC to exit
- Custom widgets allow Tab to exit
- No infinite loops in focus order

**Implementation:**
```tsx
// ✅ Modal with proper focus management
const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      const previousFocus = document.activeElement;

      // Focus first element in modal
      modalRef.current?.focus();

      // Return focus on close
      return () => {
        previousFocus?.focus();
      };
    }
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }

    // Trap Tab within modal (use focus-trap library)
    if (e.key === 'Tab') {
      // Cycle focus within modal bounds
    }
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {children}
    </div>
  );
};
```

---

#### 2.2 Enough Time

##### 2.2.1 Timing Adjustable - A (applies to AA)
**No automatic timeouts without warning:**
- Notifications stay until dismissed (no auto-hide after 5s)
- Session timeouts show warning with extend option
- Auto-refresh pauses if user interacting

**Implementation:**
```tsx
// ✅ Notification without auto-dismiss
<Toast
  message="Rule saved successfully"
  dismissible={true}
  // No timeout prop - stays until user clicks X
/>

// ❌ Bad: Auto-dismiss
<Toast
  message="Rule saved successfully"
  autoHideDuration={5000} // WCAG violation if critical info
/>
```

---

#### 2.4 Navigable

##### 2.4.3 Focus Order - A (applies to AA)
**Focus order is logical and intuitive:**
- Top-to-bottom, left-to-right (for LTR languages)
- Tab order matches visual order
- No unexpected jumps

**Testing:** Tab through entire page and verify order matches visual layout

---

##### 2.4.7 Focus Visible - AA
**Focus indicator always visible:**
- All interactive elements show focus ring
- Minimum 2px outline
- Sufficient contrast (3:1 against background)
- Never use `outline: none` without custom focus style

**Implementation:**
```css
/* ✅ Global focus styles */
*:focus-visible {
  outline: 2px solid #2563eb; /* blue-600 */
  outline-offset: 2px;
  border-radius: 4px;
}

/* Custom focus for specific components */
button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

input:focus-visible {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

---

### Understandable (Information and operation of UI must be understandable)

#### 3.1 Readable

##### 3.1.1 Language of Page - A (applies to AA)
**Page language declared:**
```html
<html lang="en">
```

##### 3.1.2 Language of Parts - AA
**Language changes marked:**
```html
<p>The system uses <span lang="la">et cetera</span> for abbreviation.</p>
```

---

#### 3.2 Predictable

##### 3.2.1 On Focus - A (applies to AA)
**Focus doesn't trigger unexpected actions:**
- No navigation on focus (only on click/enter)
- No form submission on focus
- No modal opening on focus

##### 3.2.2 On Input - A (applies to AA)
**Input doesn't trigger unexpected actions:**
- No form auto-submit on typing
- No navigation on selection change (without explicit button)
- Acceptable: Update preview panel on input (expected behavior)

**Implementation:**
```tsx
// ❌ Bad: Auto-submit on change
<select onChange={(e) => submitForm()}>

// ✅ Good: Explicit submit button
<select onChange={(e) => setField(e.target.value)}>
<button onClick={submitForm}>Save</button>
```

---

#### 3.3 Input Assistance

##### 3.3.1 Error Identification - A (applies to AA)
**Errors clearly identified:**
- Error message text (not just red border)
- Field label included in error message
- Clear instructions to fix

**Implementation:**
```tsx
// ✅ Accessible error state
<div>
  <label htmlFor="confidence">Confidence Threshold</label>
  <input
    id="confidence"
    type="number"
    value={confidence}
    aria-invalid={error ? "true" : "false"}
    aria-describedby={error ? "confidence-error" : undefined}
  />
  {error && (
    <p id="confidence-error" role="alert">
      Confidence threshold must be between 0 and 1.
      Current value: {confidence}
    </p>
  )}
</div>
```

##### 3.3.2 Labels or Instructions - A (applies to AA)
**All inputs have labels or instructions:**
- Visible label (not just placeholder)
- Helper text for complex fields
- Required fields marked

**Implementation:**
```tsx
// ✅ Complete input with label and help text
<div>
  <label htmlFor="cron-expression">
    Schedule (Cron Expression)
    <abbr title="required" aria-label="required">*</abbr>
  </label>
  <input
    id="cron-expression"
    type="text"
    required
    aria-describedby="cron-help"
  />
  <p id="cron-help" className="text-sm text-gray-600">
    Format: minute hour day month weekday (e.g., "0 14 * * 1" for Mondays at 2pm)
  </p>
</div>
```

##### 3.3.3 Error Suggestion - AA
**Provide suggestions to fix errors:**
```tsx
// ✅ Error with suggestion
{error && (
  <p role="alert">
    Confidence threshold must be between 0 and 1.
    <br />
    <strong>Suggestion:</strong> Try 0.85 (your historical average)
  </p>
)}
```

##### 3.3.4 Error Prevention (Legal, Financial, Data) - AA
**Confirmation required for critical actions:**
- Delete rule → confirmation dialog
- Disable all automations → confirmation dialog
- Bulk approve/reject → review before execute

**Implementation:**
```tsx
// ✅ Confirmation dialog for destructive action
<AlertDialog>
  <AlertDialogTrigger asChild>
    <button>Delete Rule</button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Delete "High Confidence Auto-Approval"?</AlertDialogTitle>
    <AlertDialogDescription>
      This will permanently delete this automation rule.
      This action cannot be undone.
    </AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={deleteRule}>
        Delete Permanently
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Robust (Content must be robust enough for assistive technologies)

#### 4.1 Compatible

##### 4.1.2 Name, Role, Value - A (applies to AA)
**All components have accessible name, role, and state:**

**ARIA Roles for Custom Components:**
```tsx
// Toggle Switch (not native checkbox)
<button
  role="switch"
  aria-checked={isEnabled}
  onClick={() => setIsEnabled(!isEnabled)}
>
  {isEnabled ? 'Enabled' : 'Disabled'}
</button>

// Tab Component
<div role="tablist" aria-label="Automation Settings">
  <button
    role="tab"
    aria-selected={activeTab === 'schedule'}
    aria-controls="schedule-panel"
    id="schedule-tab"
  >
    Schedule
  </button>
  <div
    role="tabpanel"
    id="schedule-panel"
    aria-labelledby="schedule-tab"
    hidden={activeTab !== 'schedule'}
  >
    {/* Schedule content */}
  </div>
</div>

// Progress Indicator
<div
  role="progressbar"
  aria-valuenow={currentStep}
  aria-valuemin={1}
  aria-valuemax={5}
  aria-label="Onboarding progress"
>
  Step {currentStep} of 5
</div>

// Status Badge
<span
  role="status"
  aria-live="polite"
  className="badge-success"
>
  <span className="sr-only">Status:</span>
  Enabled
</span>
```

---

## Screen Reader Optimization

### Live Regions for Dynamic Updates

**Use `aria-live` for updates without page reload:**

```tsx
// Toast notifications
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  Rule "High Confidence Auto-Approval" saved successfully
</div>

// Critical errors
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  Automation failed: Database connection lost
</div>

// Dashboard metrics (real-time updates)
<div aria-live="polite" aria-atomic="false">
  <span>Auto-approval rate: {rate}%</span>
</div>
```

**aria-live values:**
- `off` (default): No announcements
- `polite`: Announce when user idle (non-urgent)
- `assertive`: Announce immediately (urgent errors)

---

### Screen Reader Only Text

**Provide context for screen reader users:**

```tsx
// Hidden visually, read by screen readers
<span className="sr-only">Delete rule</span>
<TrashIcon />

// CSS for sr-only class
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**When to use:**
- Icon-only buttons
- Decorative images that convey meaning
- Skip navigation links
- Status indicators (color alone insufficient)

---

### Descriptive Link Text

```tsx
// ❌ Bad: Generic link text
<a href="/docs">Click here</a>

// ✅ Good: Descriptive link text
<a href="/docs">View automation documentation</a>

// ✅ Also good: Context from surrounding text
<p>
  Learn how to create custom automation rules.
  <a href="/docs/rules">Read the rule builder guide</a>
</p>
```

---

## Touch Target Size (Mobile)

**Minimum 44x44px touch targets (WCAG 2.1 AA):**

```tsx
// ✅ Adequate touch target
<button className="min-h-[44px] min-w-[44px] p-3">
  <TrashIcon className="w-5 h-5" />
</button>

// ❌ Too small (violation)
<button className="p-1">
  <TrashIcon className="w-3 h-3" />
</button>
```

**Spacing between targets:**
- Minimum 8px spacing (prevents mis-taps)
- Optimal 12px spacing

---

## Form Accessibility Best Practices

### Required Fields

```tsx
// ✅ Multiple indicators for required fields
<label htmlFor="rule-name">
  Rule Name
  <abbr title="required" aria-label="required">*</abbr>
</label>
<input
  id="rule-name"
  required
  aria-required="true"
/>
```

### Field Groups

```tsx
// ✅ Group related fields with fieldset
<fieldset>
  <legend>Condition Thresholds</legend>

  <label htmlFor="confidence">Confidence Score</label>
  <input id="confidence" type="number" />

  <label htmlFor="similarity">Similarity Score</label>
  <input id="similarity" type="number" />
</fieldset>
```

### Radio Button Groups

```tsx
// ✅ Accessible radio group
<fieldset>
  <legend>Schedule Frequency</legend>

  <label>
    <input type="radio" name="frequency" value="hourly" />
    Hourly
  </label>

  <label>
    <input type="radio" name="frequency" value="daily" />
    Daily
  </label>

  <label>
    <input type="radio" name="frequency" value="weekly" />
    Weekly
  </label>
</fieldset>
```

---

## Chart & Data Visualization Accessibility

### Alternative Representations

**Provide multiple ways to access data:**

```tsx
// ✅ Accessible chart component
<div>
  <h3 id="chart-title">Auto-Approval Rate Trend</h3>

  {/* Visual chart */}
  <LineChart
    aria-labelledby="chart-title"
    aria-describedby="chart-description"
  >
    {/* Chart implementation */}
  </LineChart>

  {/* Text description */}
  <p id="chart-description" className="sr-only">
    Line chart showing auto-approval rate over the last 7 days.
    Rate increased from 82% on Nov 20 to 87% on Nov 26,
    representing a 5 percentage point improvement.
  </p>

  {/* Data table alternative */}
  <details>
    <summary>View data table</summary>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Auto-Approval Rate</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Nov 20</td>
          <td>82%</td>
        </tr>
        {/* More rows */}
      </tbody>
    </table>
  </details>
</div>
```

---

## Testing Checklist

### Manual Testing

**Keyboard Navigation:**
- [ ] Tab through entire page (logical order)
- [ ] All interactive elements reachable
- [ ] Focus indicators visible
- [ ] ESC closes modals/dropdowns
- [ ] Enter/Space activates buttons
- [ ] No keyboard traps

**Screen Reader Testing (NVDA/JAWS/VoiceOver):**
- [ ] All images have alt text
- [ ] Form labels announced
- [ ] Error messages announced
- [ ] Status updates announced (aria-live)
- [ ] Table headers announced
- [ ] Button purposes clear
- [ ] Link destinations clear

**Color Contrast:**
- [ ] All text meets 4.5:1 (or 3:1 for large text)
- [ ] UI components meet 3:1
- [ ] Focus indicators meet 3:1
- [ ] Test with Chrome DevTools Lighthouse

**Responsive/Zoom:**
- [ ] Page usable at 200% zoom
- [ ] No horizontal scrolling at 200% zoom
- [ ] Touch targets ≥ 44x44px on mobile

---

### Automated Testing

**Tools:**
1. **axe DevTools** (Chrome extension) - catches 57% of issues
2. **Lighthouse** (Chrome DevTools) - accessibility audit
3. **WAVE** (browser extension) - visual accessibility checker
4. **pa11y** (CLI tool) - automated CI/CD checks

**CI/CD Integration:**
```bash
# Run automated accessibility tests
npx pa11y-ci --config .pa11yci.json

# .pa11yci.json
{
  "defaults": {
    "standard": "WCAG2AA",
    "timeout": 10000
  },
  "urls": [
    "http://localhost:3000/automation",
    "http://localhost:3000/automation/rules/new",
    "http://localhost:3000/automation/dashboard"
  ]
}
```

---

## Common Accessibility Mistakes to Avoid

### 1. Placeholder as Label
```tsx
// ❌ Bad: Placeholder only (disappears on input)
<input placeholder="Enter rule name" />

// ✅ Good: Label + optional placeholder
<label htmlFor="rule-name">Rule Name</label>
<input id="rule-name" placeholder="e.g., High Confidence Auto-Approval" />
```

### 2. Color-Only Information
```tsx
// ❌ Bad: Status indicated by color alone
<div className="bg-green-500 rounded-full w-3 h-3" />

// ✅ Good: Status with text and color
<span className="flex items-center gap-2">
  <div className="bg-green-500 rounded-full w-3 h-3" aria-hidden="true" />
  <span>Enabled</span>
</span>
```

### 3. Missing Focus Indicators
```css
/* ❌ Bad: Remove focus outline */
*:focus {
  outline: none;
}

/* ✅ Good: Custom focus style */
*:focus-visible {
  outline: 2px solid blue;
  outline-offset: 2px;
}
```

### 4. Inaccessible Modals
```tsx
// ❌ Bad: No focus management
<div className="modal">
  <h2>Delete Rule?</h2>
  <button>Cancel</button>
  <button>Delete</button>
</div>

// ✅ Good: Proper modal
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  tabIndex={-1}
  onKeyDown={handleEscape}
>
  <h2 id="dialog-title">Delete Rule?</h2>
  <button>Cancel</button>
  <button>Delete</button>
</div>
```

---

## Resources

### Testing Tools
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **Lighthouse**: Built into Chrome DevTools
- **WAVE**: https://wave.webaim.org/extension/
- **NVDA Screen Reader**: https://www.nvaccess.org/download/
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/

### Documentation
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility

### Design Resources
- **Accessible Color Palette Generator**: https://venngage.com/tools/accessible-color-palette-generator
- **Focus Indicator Guide**: https://www.sarasoueidan.com/blog/focus-indicators/

---

*Document prepared by: Accessibility Team*
*Date: 2025-10-26*
*Version: 1.0*
*WCAG Version: 2.1 Level AA*
