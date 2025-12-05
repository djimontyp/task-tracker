# Button Component

## Purpose

Trigger actions and navigate. Buttons are the primary interactive element in Pulse Radar.

## Variants

| Variant | Use | Appearance |
|---------|-----|-----------|
| **default** | Primary action (save, submit, approve) | Orange background, white text, shadow |
| **destructive** | Delete, reject, cancel (requires confirmation) | Red background, white text |
| **outline** | Secondary action (cancel, filter) | Border, light background, dark text |
| **secondary** | Alternate action | Gray background, dark text |
| **ghost** | Tertiary action, sidebar navigation | No background, dark text on hover |
| **link** | Text link action | Text-only, underline on hover |

## Sizes

| Size | Height | Padding | Use |
|------|--------|---------|-----|
| **icon** | 44px | None | Icon-only buttons (44×44px) |
| **sm** | 32px | 12px H | Small, compact (form toolbars) |
| **default** | 36px | 16px H | Standard buttons |
| **lg** | 40px | 32px H | Large, call-to-action |

## States

### Default (Resting)

```jsx
<Button>Click Me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Secondary</Button>
<Button variant="link">Text Link</Button>
```

**Visual:**
- Full color (variant-specific)
- No shadow or subtle shadow
- Cursor: pointer
- Ready to interact

### Hover

```jsx
// Hover automatically applies via Tailwind
<Button className="hover:bg-primary/90">Primary</Button>
```

**Visual:**
- Background 10% darker (opacity/90)
- Slight shadow increase (if present)
- No scale change (avoid animation frustration)

### Focus (Keyboard)

```jsx
<Button>
  {/* Focus automatically applies via global styles */}
</Button>

// Visual: 3px ring outline with 2px offset
// Color: ring-ring (primary orange)
// Visible on all backgrounds
```

**Visual:**
- 3px solid ring outline
- 2px offset from button edge
- Ring color: primary (orange)
- Visible on all backgrounds (3:1 contrast minimum)

### Pressed/Active

```jsx
// Active state (when button action is ongoing)
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="animate-spin" />}
  {isLoading ? "Saving..." : "Save"}
</Button>
```

**Visual:**
- Darker background shade (primary/80)
- Spinner icon shown (if loading)
- Disabled cursor
- Text updates to "Saving..." / "Processing..."

### Disabled

```jsx
<Button disabled>Disabled Button</Button>
<Button disabled variant="destructive">Delete (Disabled)</Button>
```

**Visual:**
- Opacity: 50% (faded appearance)
- Cursor: not-allowed
- No hover effect
- Semantic: still visible (not hidden)

### Loading

```jsx
const [isLoading, setIsLoading] = useState(false)

<Button
  loading={isLoading}
  onClick={() => {
    setIsLoading(true)
    // API call...
  }}
>
  {isLoading ? "Saving..." : "Save"}
</Button>
```

**Visual:**
- Spinner icon displayed (animated)
- Button disabled (prevents double-click)
- Text changes to action name + "..."
- Spinner rotates smoothly (respects prefers-reduced-motion)

## Anatomy

```
┌─────────────────────────────────┐
│  [Icon]  Button Text  [Spinner] │  ← Contents (flexbox)
└─────────────────────────────────┘
←──── Padding ──────→
                    ↑
              Height (size-dependent)
```

**Structure:**
- `display: inline-flex`
- `align-items: center`
- `justify-content: center`
- `gap: 8px` (between icon and text)
- `min-width: auto` (no minimum width)

## Usage Examples

### Primary Action (Default)

```jsx
<Button onClick={handleSave}>
  Save
</Button>

// With icon
<Button onClick={handleCreate}>
  <Plus className="h-4 w-4" />
  Create New
</Button>

// Loading state
<Button loading={isSaving}>
  Save
</Button>
```

### Destructive Action

```jsx
// Always requires confirmation before destructive action
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Delete item?</AlertDialogTitle>
    <AlertDialogDescription>
      This action cannot be undone.
    </AlertDialogDescription>
    <AlertDialogCancel>Cancel</AlertDialogCancel>
    <AlertDialogAction variant="destructive">
      Delete Permanently
    </AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

### Icon Button

```jsx
// Icon-only button (must have aria-label)
<Button size="icon" aria-label="Close dialog">
  <X className="h-5 w-5" />
</Button>

// Group of icon buttons
<div className="flex gap-2">
  <Button size="icon" aria-label="Edit">
    <Pencil className="h-4 w-4" />
  </Button>
  <Button size="icon" aria-label="Delete">
    <Trash className="h-4 w-4" />
  </Button>
</div>
```

### Secondary Actions

```jsx
// Outline button (secondary)
<Button variant="outline">
  Cancel
</Button>

// Ghost button (tertiary)
<Button variant="ghost">
  View Details
</Button>

// Link button (text-only)
<Button variant="link">
  Learn more →
</Button>
```

### Button Groups

```jsx
// Dialog actions (right-aligned)
<DialogFooter className="flex justify-end gap-2">
  <Button variant="outline">Cancel</Button>
  <Button>Save Changes</Button>
</DialogFooter>

// Inline actions (left-aligned)
<div className="flex gap-2">
  <Button size="sm">Apply</Button>
  <Button size="sm" variant="outline">Reset</Button>
</div>
```

## Accessibility Requirements

### WCAG 2.1 AA

- [ ] **Minimum 44×44px** touch target (WCAG 2.5.5)
- [ ] **Visible focus indicator** (WCAG 2.4.7)
  - 3px ring outline visible on all backgrounds
  - Contrast ≥3:1 with adjacent colors
- [ ] **Keyboard accessible** (WCAG 2.1.1)
  - Tab/Shift+Tab navigation
  - Enter/Space activation
- [ ] **Icon buttons have aria-label** (WCAG 1.1.1)
  - `aria-label="Delete"` required for icon-only buttons
- [ ] **Sufficient contrast** (WCAG 1.4.11)
  - Button text ≥4.5:1 contrast on background
  - Focus ring ≥3:1 contrast

### Best Practices

```jsx
// ✅ CORRECT — Icon button with label
<Button size="icon" aria-label="Delete item">
  <Trash className="h-4 w-4" />
</Button>

// ❌ WRONG — No label
<Button size="icon">
  <Trash className="h-4 w-4" />
</Button>

// ✅ CORRECT — 44×44px minimum
<Button size="icon" className="h-11 w-11">
  <Plus />
</Button>

// ❌ WRONG — Too small
<Button size="icon" className="h-6 w-6">
  <Plus />
</Button>

// ✅ CORRECT — Disabled with explanation
<Button disabled title="Complete all fields first">
  Submit
</Button>

// ❌ WRONG — No reason for disabled
<Button disabled>Submit</Button>
```

## Do's and Don'ts

### Do's ✅

- **Do** use semantic button text ("Save", "Delete", not "OK" or "Yes")
- **Do** disable buttons during loading or form submission
- **Do** use icon + text for clarity (icon + "Delete", not just trash icon)
- **Do** group related actions (Cancel + Save together)
- **Do** use ghost buttons for secondary navigation
- **Do** align buttons consistently (right-aligned in dialogs, left in toolbars)
- **Do** show loading spinner during async operations
- **Do** pair destructive buttons with confirmation dialogs

### Don'ts ❌

- **Don't** use all caps except badges/labels
- **Don't** mix multiple primary buttons in same context
- **Don't** use button color to communicate status (use icon/text)
- **Don't** nest buttons (button inside button)
- **Don't** use <div> with button styling (use <button> element)
- **Don't** make button text too long (max 3 words)
- **Don't** use animated background transitions
- **Don't** rely on color alone (color-blind users)

## Code Examples

### Form Submission

```jsx
const [isSaving, setIsSaving] = useState(false)
const [error, setError] = useState<string | null>(null)

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setIsSaving(true)
  setError(null)

  try {
    await saveForm()
    toast.success("Saved!")
  } catch (err) {
    setError(err.message)
  } finally {
    setIsSaving(false)
  }
}

return (
  <form onSubmit={handleSubmit} className="space-y-4">
    <input type="email" required />

    {error && (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}

    <Button type="submit" loading={isSaving}>
      {isSaving ? "Saving..." : "Save"}
    </Button>
  </form>
)
```

### Icon Button with Tooltip

```jsx
import { Button } from "@/shared/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

export function DeleteButton({ onClick, disabled }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClick}
          disabled={disabled}
          aria-label="Delete item"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Delete (Ctrl+D)</TooltipContent>
    </Tooltip>
  )
}
```

### Button Variants Showcase

```jsx
export function ButtonShowcase() {
  return (
    <div className="space-y-6 p-6">
      {/* Variants */}
      <div className="flex gap-2 flex-wrap">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button variant="destructive">Destructive</Button>
      </div>

      {/* Sizes */}
      <div className="flex gap-2 items-center flex-wrap">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">→</Button>
      </div>

      {/* States */}
      <div className="flex gap-2 flex-wrap">
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
      </div>

      {/* With Icons */}
      <div className="flex gap-2 flex-wrap">
        <Button>
          <Plus className="h-4 w-4" />
          Create
        </Button>
        <Button variant="destructive">
          <Trash className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  )
}
```

## Component Props

```typescript
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean  // Render as child component (for Links)
  loading?: boolean  // Show spinner, disable interaction
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  children?: React.ReactNode
  className?: string
  // ... all standard button attributes
}
```

## Migration from Hardcoded Buttons

### Before
```jsx
// Hardcoded color + sizing
<button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
  Save
</button>
```

### After
```jsx
// Using Button component
<Button>Save</Button>
</Button>
```

---

## Specification Summary

| Property | Value |
|----------|-------|
| **Component** | `<Button>` |
| **Location** | `frontend/src/shared/ui/button.tsx` |
| **Variants** | 6 (default, destructive, outline, secondary, ghost, link) |
| **Sizes** | 4 (icon, sm, default, lg) |
| **Icon Size** | 16px (h-4 w-4) |
| **Min Touch Target** | 44×44px |
| **Padding** | Variant + size dependent |
| **Transition** | 200ms (colors) |
| **Focus Style** | 3px ring, 2px offset |
| **Disabled State** | opacity-50, cursor-not-allowed |

