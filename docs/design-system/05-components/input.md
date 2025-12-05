# Input Component

## Purpose

Capture user text input. Includes text, email, password, search, textarea, number, and other HTML5 input types.

## Input Types

| Type | HTML | Use | Example |
|------|------|-----|---------|
| **text** | `type="text"` | Generic text | Name, title |
| **email** | `type="email"` | Email address | Email field |
| **password** | `type="password"` | Secret text | Login, API key |
| **search** | `type="search"` | Search query | Search bar |
| **number** | `type="number"` | Numeric | Count, price |
| **url** | `type="url"` | Web address | Website URL |
| **tel** | `type="tel"` | Phone number | Contact number |
| **date** | `type="date"` | Calendar picker | Date selection |
| **time** | `type="time"` | Time picker | Time selection |
| **textarea** | `<textarea>` | Multi-line text | Description, content |

## Sizes

| Size | Height | Padding | Use |
|------|--------|---------|-----|
| **sm** | 32px | 8px H, 6px V | Compact forms |
| **default** | 36px | 12px H, 8px V | Standard |
| **lg** | 40px | 16px H, 10px V | Large forms |

## States

### Default (Resting)

```jsx
<Input type="text" placeholder="Enter value" />
```

**Visual:**
- Border: 1px, light gray
- Background: White (light mode), dark (dark mode)
- Text color: Foreground
- Cursor: text
- Placeholder: muted-foreground (lighter text)

### Focused

```jsx
<Input type="text" autoFocus />
```

**Visual:**
- Border: 2px primary color (orange)
- Ring: 3px outline (focus ring)
- Outline offset: 2px
- Shadow: Optional subtle shadow
- Cursor: text (blinking)

### Filled

```jsx
<Input type="text" value="User entered text" readOnly />
```

**Visual:**
- Text color: Foreground (readable)
- Border: Normal (1px, no focus state)
- Value visible, placeholder hidden

### Error

```jsx
<Input type="email" value="invalid" aria-invalid="true" />
```

**Visual:**
- Border: 2px red (destructive)
- Background: Slight red tint (optional)
- Error message below field
- Icon: Exclamation mark (optional)

### Disabled

```jsx
<Input type="text" disabled placeholder="Cannot edit" />
```

**Visual:**
- Opacity: 50% (faded appearance)
- Border: Lighter gray
- Background: Disabled gray
- Cursor: not-allowed
- Text: Non-interactive appearance

### Loading/Validating

```jsx
<Input type="email" value="checking@email.com" />
{/* Show spinner icon */}
<Spinner className="absolute right-3" />
```

**Visual:**
- Spinner icon on right
- Border: Light orange (warning state)
- Text: User input shown
- Disabled until validation completes

## Anatomy

```
┌──────────────────────────────────┐
│ Label                            │  ← Label (outside)
│                                  │
│ ┌─ Prefix ─ Input field ─ Icon┐ │  ← Border, padding
│ │  $      [___________]     ✓  │  │
│ └────────────────────────────────┘
│                                  │
│ Helper text or error message     │  ← Feedback (below)
└──────────────────────────────────┘
```

**Structure:**
- `<input>` or `<textarea>` element (semantic)
- Optional prefix icon/text (left side)
- Optional suffix icon/button (right side)
- Border with focus ring
- Padding: 8px (horizontal), 6px (vertical) default

## Usage Examples

### Simple Text Input

```jsx
import { Input } from '@/shared/ui/input'

<Input
  type="text"
  placeholder="Enter your name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
```

### Input with Label

```jsx
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

<div className="space-y-2">
  <Label htmlFor="email">Email Address</Label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
  />
</div>
```

### Input with Helper Text

```jsx
<div className="space-y-2">
  <Label htmlFor="password">Password</Label>
  <Input
    id="password"
    type="password"
    placeholder="••••••••"
  />
  <span className="text-xs text-muted-foreground">
    Minimum 8 characters, 1 uppercase, 1 number
  </span>
</div>
```

### Input with Error

```jsx
const [email, setEmail] = useState('')
const [error, setError] = useState<string | null>(null)

function handleChange(value: string) {
  setEmail(value)

  if (!value.includes('@')) {
    setError('Please enter a valid email')
  } else {
    setError(null)
  }
}

return (
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input
      id="email"
      type="email"
      value={email}
      onChange={(e) => handleChange(e.target.value)}
      aria-invalid={!!error}
      aria-describedby={error ? 'error-message' : undefined}
    />
    {error && (
      <span id="error-message" className="text-xs text-destructive">
        {error}
      </span>
    )}
  </div>
)
```

### Search Input

```jsx
import { Input } from '@/shared/ui/input'
import { Search, X } from 'lucide-react'

export function SearchInput({ value, onChange }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
```

### Textarea

```jsx
import { Textarea } from '@/shared/ui/textarea'

<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <Textarea
    id="description"
    placeholder="Enter a detailed description..."
    rows={4}
    maxLength={500}
    value={description}
    onChange={(e) => setDescription(e.target.value)}
  />
  <span className="text-xs text-muted-foreground">
    {description.length}/500 characters
  </span>
</div>
```

### Number Input

```jsx
<div className="space-y-2">
  <Label htmlFor="count">Quantity</Label>
  <Input
    id="count"
    type="number"
    min="1"
    max="100"
    placeholder="1"
  />
</div>
```

### Password Input with Toggle

```jsx
import { Input } from '@/shared/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export function PasswordInput(props: InputProps) {
  const [shown, setShown] = useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        type={shown ? 'text' : 'password'}
      />
      <button
        onClick={() => setShown(!shown)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={shown ? 'Hide password' : 'Show password'}
      >
        {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
```

### Form with Multiple Inputs

```jsx
<form className="space-y-4 max-w-lg">
  <div className="space-y-2">
    <Label htmlFor="first-name">First Name</Label>
    <Input id="first-name" placeholder="John" />
  </div>

  <div className="space-y-2">
    <Label htmlFor="last-name">Last Name</Label>
    <Input id="last-name" placeholder="Doe" />
  </div>

  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" placeholder="john@example.com" />
  </div>

  <div className="space-y-2">
    <Label htmlFor="message">Message</Label>
    <Textarea id="message" placeholder="Your message..." rows={4} />
  </div>

  <Button type="submit">Send</Button>
</form>
```

## Accessibility Requirements

- [ ] **Label association** (WCAG 1.3.1)
  - `<label htmlFor="inputId">` paired with `<input id="inputId">`
- [ ] **Error messages** (WCAG 3.3.1)
  - Programmatically related via `aria-describedby`
  - Visible text error message
- [ ] **Focus indicator** (WCAG 2.4.7)
  - 3px ring outline visible when focused
  - Contrast ≥3:1 on all backgrounds
- [ ] **Keyboard accessible** (WCAG 2.1.1)
  - Tab navigation (natural order)
  - Form submission via Enter
- [ ] **Color contrast** (WCAG 1.4.3)
  - Border ≥1.5:1 contrast (light/dark distinction)
  - Text ≥4.5:1 contrast on background
- [ ] **Min font size** (WCAG 1.4.4)
  - Text never smaller than 14px (prevents mobile zoom)

## Do's and Don'ts

### Do's ✅

- **Do** associate labels with inputs via `htmlFor`
- **Do** use appropriate `type` attributes (email, password, etc.)
- **Do** provide error messages on validation failure
- **Do** show required field indicator (asterisk or "required" text)
- **Do** use placeholder text only as additional hint (not label)
- **Do** indicate character limits for long fields
- **Do** use aria-invalid and aria-describedby for errors
- **Do** support all keyboard interactions (Tab, Enter, etc.)

### Don'ts ❌

- **Don't** use only color to indicate error (add icon/text)
- **Don't** remove focus indicator
- **Don't** use placeholder as label (placeholder disappears)
- **Don't** mix custom styling with Tailwind classes
- **Don't** disable autocomplete unnecessarily
- **Don't** make inputs smaller than 44px height on mobile
- **Don't** clear error messages on character change (only on valid state)
- **Don't** use readonly when disabled is appropriate

## Code Examples

### Custom Input Wrapper

```jsx
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
}

export function FormField({
  label,
  error,
  helperText,
  required,
  id,
  ...props
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <Input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-help` : undefined}
        {...props}
      />

      {error && (
        <span id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </span>
      )}

      {helperText && !error && (
        <span id={`${id}-help`} className="text-xs text-muted-foreground">
          {helperText}
        </span>
      )}
    </div>
  )
}
```

---

## Specification Summary

| Property | Value |
|----------|-------|
| **Component** | `<Input>` or `<Textarea>` |
| **Location** | `frontend/src/shared/ui/input.tsx`, `textarea.tsx` |
| **Element** | Native `<input>` or `<textarea>` |
| **Height** | 36px default (h-9) |
| **Padding** | 12px H, 8px V (px-3 py-2) |
| **Border** | 1px, light gray (`border-input`) |
| **Focus Border** | 2px primary color |
| **Focus Ring** | 3px outline with 2px offset |
| **Placeholder** | muted-foreground color |
| **Font Size** | 14px (never smaller, prevents zoom) |
| **Dark Mode** | Auto via CSS variables |
| **Error State** | Red border, error message below |
| **Disabled State** | Opacity 50%, not-allowed cursor |

