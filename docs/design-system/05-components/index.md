# Components Library

## Overview

Pulse Radar design system includes **33 shadcn/ui components** organized by function. All components use:
- **Radix UI primitives** (accessibility built-in)
- **Tailwind CSS** styling
- **CSS variables** for theming (light/dark mode)
- **TypeScript** for type safety

## Navigation

### Core Interactive Components

- **[Button](./button.md)** — Trigger actions, primary interaction
- **[Card](./card.md)** — Container for grouped content
- **[Input](./input.md)** — Text input, select, textarea
- **[Checkbox](./checkbox.md)** — Binary choice
- **[Switch](./switch.md)** — Toggle on/off
- **[Radio Group](./radio-group.md)** — Single choice from options
- **[Select](./select.md)** — Dropdown menu

### Feedback Components

- **[Badge](./badge.md)** — Small label/status indicator
- **[Alert](./alert.md)** — Error, warning, info message
- **[Toast](./toast.md)** — Temporary notification (Sonner)
- **[Skeleton](./skeleton.md)** — Loading placeholder
- **[Progress](./progress.md)** — Progress bar

### Layout & Structure

- **[Card](./card.md)** — Content container
- **[Separator](./separator.md)** — Visual divider
- **[Tabs](./tabs.md)** — Tab navigation
- **[Sidebar](./sidebar.md)** — Navigation sidebar
- **[Breadcrumb](./breadcrumb.md)** — Navigation path

### Overlay & Dialog

- **[Dialog](./dialog.md)** — Modal dialog
- **[Alert Dialog](./alert-dialog.md)** — Confirmation dialog
- **[Sheet](./sheet.md)** — Side drawer
- **[Popover](./popover.md)** — Floating panel
- **[Dropdown Menu](./dropdown-menu.md)** — Context menu
- **[Tooltip](./tooltip.md)** — Hover information
- **[Command](./command.md)** — Command palette (search)

### Data Display

- **[Table](./table.md)** — Data grid
- **[Pagination](./pagination.md)** — Page navigation
- **[Chart](./chart.md)** — Recharts wrapper
- **[Slider](./slider.md)** — Range selector
- **[Avatar](./avatar.md)** — User avatar

### Additional Components

- **[Label](./label.md)** — Form label
- **[Textarea](./textarea.md)** — Multi-line input
- **[Collapsible](./collapsible.md)** — Expandable section
- **[Notification Badge](./notification-badge.md)** — Dot indicator

---

## Quick Component Selection

### When to Use What?

**Need to show data?**
→ Use **Card** for grouping, **Table** for structured data, **Badge** for status

**Need user input?**
→ Use **Input** for text, **Select** for options, **Checkbox** for toggles, **Textarea** for long text

**Need to communicate something?**
→ Use **Alert** for persistent, **Toast** for temporary, **Tooltip** for hover info

**Need navigation?**
→ Use **Button** for actions, **Link** for navigation, **Breadcrumb** for path, **Tabs** for sections

**Need a choice dialog?**
→ Use **Dialog** for form/content, **Alert Dialog** for confirmation, **Sheet** for side panel

---

## Component Inventory

| Component | Status | Type | Location |
|-----------|--------|------|----------|
| Alert | ✅ | Feedback | `shared/ui/alert.tsx` |
| Alert Dialog | ✅ | Dialog | `shared/ui/alert-dialog.tsx` |
| Avatar | ✅ | Display | `shared/ui/avatar.tsx` |
| Badge | ✅ | Feedback | `shared/ui/badge.tsx` |
| Breadcrumb | ✅ | Navigation | `shared/ui/breadcrumb.tsx` |
| Button | ✅ | Interactive | `shared/ui/button.tsx` |
| Card | ✅ | Layout | `shared/ui/card.tsx` |
| Checkbox | ✅ | Interactive | `shared/ui/checkbox.tsx` |
| Collapsible | ✅ | Navigation | `shared/ui/collapsible.tsx` |
| Command | ✅ | Input | `shared/ui/command.tsx` |
| Dialog | ✅ | Dialog | `shared/ui/dialog.tsx` |
| Dropdown Menu | ✅ | Menu | `shared/ui/dropdown-menu.tsx` |
| Input | ✅ | Interactive | `shared/ui/input.tsx` |
| Label | ✅ | Form | `shared/ui/label.tsx` |
| Notification Badge | ✅ | Feedback | `shared/ui/notification-badge.tsx` |
| Pagination | ✅ | Navigation | `shared/ui/pagination.tsx` |
| Popover | ✅ | Dialog | `shared/ui/popover.tsx` |
| Progress | ✅ | Feedback | `shared/ui/progress.tsx` |
| Radio Group | ✅ | Interactive | `shared/ui/radio-group.tsx` |
| Select | ✅ | Interactive | `shared/ui/select.tsx` |
| Separator | ✅ | Layout | `shared/ui/separator.tsx` |
| Sheet | ✅ | Dialog | `shared/ui/sheet.tsx` |
| Sidebar | ✅ | Layout | `shared/ui/sidebar.tsx` |
| Skeleton | ✅ | Feedback | `shared/ui/skeleton.tsx` |
| Slider | ✅ | Interactive | `shared/ui/slider.tsx` |
| Sonner | ✅ | Feedback | `shared/ui/sonner.tsx` |
| Switch | ✅ | Interactive | `shared/ui/switch.tsx` |
| Table | ✅ | Data | `shared/ui/table.tsx` |
| Tabs | ✅ | Navigation | `shared/ui/tabs.tsx` |
| Textarea | ✅ | Input | `shared/ui/textarea.tsx` |
| Tooltip | ✅ | Overlay | `shared/ui/tooltip.tsx` |
| Chart | ✅ | Data | `shared/ui/chart.tsx` |

---

## Import Pattern

All components use the same import path:

```jsx
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Dialog, DialogContent, DialogHeader } from '@/shared/ui/dialog'
import { cn } from '@/shared/lib'  // Class merging utility
```

---

## Design Patterns

### Form Pattern

```jsx
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Alert, AlertDescription } from '@/shared/ui/alert'

export function FormExample() {
  const [error, setError] = useState<string | null>(null)

  return (
    <form className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit">Submit</Button>
    </form>
  )
}
```

### List Pattern

```jsx
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'

export function ListExample({ items }) {
  return (
    <div className="space-y-2">
      {items.map(item => (
        <Card key={item.id} className="p-3 hover:bg-accent">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{item.name}</span>
            <Badge>{item.status}</Badge>
          </div>
        </Card>
      ))}
    </div>
  )
}
```

### Modal Pattern

```jsx
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'

export function ModalExample({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          Are you sure? This action cannot be undone.
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Card Grid Pattern

```jsx
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'

export function CardGridExample({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(item => (
        <Card key={item.id} className="p-4 space-y-3 hover:shadow-md transition-shadow">
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-sm text-muted-foreground">{item.description}</p>
          <Button variant="ghost" className="w-full">
            Learn more →
          </Button>
        </Card>
      ))}
    </div>
  )
}
```

---

## Customization Rules

### DO: Extend with className

```jsx
// ✅ CORRECT — Add classes without overriding
<Button className="w-full">Full Width</Button>
<Card className="p-6 hover:shadow-lg">Large Card</Card>
```

### DON'T: Override variants inline

```jsx
// ❌ WRONG — Don't inline styles that should be variants
<Button className="bg-green-500 text-white">
  {/* Hardcoded color — breaks theming */}
</Button>
```

### DO: Use semantic variants

```jsx
// ✅ CORRECT — Use defined variants
<Button variant="destructive">Delete</Button>
<Badge>PROBLEM</Badge>
```

---

## Accessibility Baseline

**All components are WCAG 2.1 AA compliant by default:**

- ✅ Keyboard navigation (Tab, Enter, Space, Arrow keys)
- ✅ Focus indicators (3px ring outline)
- ✅ Color contrast (≥4.5:1 for text)
- ✅ ARIA labels and roles
- ✅ Semantic HTML (button, input, label elements)
- ✅ Dark mode support (CSS variables)
- ✅ Reduced motion support (prefers-reduced-motion)

**No additional accessibility work needed unless:**
- Custom styling overrides default colors (check contrast)
- Custom event handlers added (add keyboard support)
- Icons used alone (add aria-label)

---

## Common Tasks

### Add a Form Field

```jsx
import { Label } from '@/shared/ui/label'
import { Input } from '@/shared/ui/input'

<div className="space-y-2">
  <Label htmlFor="field">Field Label</Label>
  <Input id="field" placeholder="Enter value" />
</div>
```

### Show a Confirmation Dialog

```jsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogTitle } from '@/shared/ui/alert-dialog'

<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogContent>
    <AlertDialogTitle>Delete item?</AlertDialogTitle>
    <AlertDialogCancel>Cancel</AlertDialogCancel>
    <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

### Display Loading State

```jsx
import { Skeleton } from '@/shared/ui/skeleton'

<div className="space-y-3">
  <Skeleton className="h-6 w-3/4" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-5/6" />
</div>
```

### Show Temporary Notification

```jsx
import { toast } from 'sonner'

button onClick={() => toast.success('Saved!')}
```

---

## Component Documentation

Each component has detailed documentation in separate files:

1. **button.md** — 6 variants, 4 sizes, loading states
2. **card.md** — Container, hover effects, grid layouts
3. **input.md** — Text field, states, validation
4. **dialog.md** — Modal, form dialogs, confirmations
5. **table.md** — Data display, sorting, pagination
6. **tabs.md** — Tab navigation, accessibility
7. **sidebar.md** — Navigation structure, collapsible
8. **badge.md** — Status indicators, semantic colors
9. **select.md** — Dropdown, multi-select
10. **checkbox.md** — Single checkbox, groups
11. **[See all components](./)**

---

## TypeScript Support

All components are fully typed:

```typescript
import { Button } from '@/shared/ui/button'
import type { ButtonProps } from '@/shared/ui/button'

// Auto-completion in IDE
const button: React.ReactNode = <Button variant="outline" />

// Type-safe props
function MyButton(props: ButtonProps) {
  return <Button {...props} />
}
```

---

## Testing Components

All components tested with:
- **Vitest** — Unit tests
- **React Testing Library** — Integration tests
- **Playwright** — E2E tests

Example:

```jsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/shared/ui/button'

test('button renders with text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
})
```

---

## Migration Checklist

If updating from hardcoded components to design system:

- [ ] Replace custom buttons with `<Button>` variants
- [ ] Replace custom cards with `<Card>`
- [ ] Replace custom inputs with `<Input>`
- [ ] Replace custom dialogs with `<Dialog>`
- [ ] Replace hardcoded colors with semantic tokens
- [ ] Test keyboard navigation (Tab, Enter)
- [ ] Test dark mode
- [ ] Test mobile responsive
- [ ] Test focus indicators visible

