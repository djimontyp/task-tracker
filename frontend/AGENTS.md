# Frontend AI Rules

> Concise rules for AI coding assistants. Full docs: `docs/design-system/`

## Tech Stack

React 18 · TypeScript · Tailwind 3.4 · shadcn/ui · Lucide icons

## Do (Critical)

### 1. Semantic Color Tokens
```tsx
✅ bg-atom-problem, bg-status-connected, text-muted-foreground
❌ bg-rose-500, bg-green-500, text-gray-500
```

### 2. Touch Targets ≥ 44px
```tsx
✅ <Button size="icon" className="h-11 w-11">
❌ <Button size="icon" className="h-9 w-9">
```

### 3. ARIA Labels on Icon Buttons
```tsx
✅ <Button size="icon" aria-label="Delete"><Trash /></Button>
❌ <Button size="icon"><Trash /></Button>
```

### 4. Status = Icon + Text
```tsx
✅ <CheckCircle /> Connected
❌ <span className="bg-green-500 rounded-full" /> (color only)
```

### 5. 4px Spacing Grid
```tsx
✅ gap-2, gap-4, p-4, space-y-4
❌ gap-1.5, gap-2.5, p-2.5 (off-grid)
```

### 6. Reduced Motion
```tsx
✅ className="animate-fade-in motion-reduce:animate-none"
```

## Don't (Never)

| ❌ Don't | Why |
|----------|-----|
| `bg-rose-500`, `bg-green-500` | Use semantic tokens |
| `h-9 w-9` for icon buttons | Too small (36px < 44px) |
| `focus:outline-none` | Breaks keyboard nav |
| `style={{ }}` | Use Tailwind classes |
| `!important` | Fix specificity properly |
| @heroicons/react, Radix Icons | Lucide only |
| Custom button variants | Use existing shadcn |

## Quick Reference

| Need | Use |
|------|-----|
| Primary action | `<Button>` |
| Secondary | `<Button variant="secondary">` |
| Destructive | `<Button variant="destructive">` |
| Problem badge | `bg-atom-problem` |
| Solution badge | `bg-atom-solution` |
| Success status | `bg-status-connected` |
| Error status | `bg-status-error` |
| Card shadow | `shadow-card` |
| Small gap | `gap-2` (8px) |
| Medium gap | `gap-4` (16px) |
| Card padding | `p-4` (16px) |

## Imports

```tsx
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/lib'
import { Trash, Check } from 'lucide-react'
```

## Commands

```bash
npx tsc --noEmit                 # Type check entire project
npm run lint                     # ESLint (catches raw colors!)
npm run lint -- --fix            # Auto-fix what's possible
```

## Files

| Type | Path |
|------|------|
| UI primitives | `src/shared/ui/` |
| Components | `src/shared/components/` |
| CSS tokens | `src/index.css` |
| Design docs | `docs/design-system/` |

## Common Patterns

### Data Table with Actions
```tsx
<DataTable
  columns={columns}
  data={data}
  isLoading={isLoading}
  emptyMessage="No items found"
/>
```

### Form with Validation
```tsx
<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="name">Name</Label>
    <Input id="name" {...register('name')} />
    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
  </div>
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? <Spinner className="mr-2" /> : null}
    Save
  </Button>
</form>
```

### Modal/Dialog
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      {/* content */}
    </div>
    <DialogFooter className="gap-2 sm:gap-0">
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Page Layout
```tsx
export default function MyPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title="Page Title" description="Optional description" />

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => <ItemCard key={item.id} item={item} />)}
      </div>
    </div>
  )
}
```

## ESLint Auto-Enforcement

These rules run automatically:
- `local-rules/no-raw-tailwind-colors` — blocks bg-red-500, text-green-600, etc.
- `local-rules/no-odd-spacing` — blocks gap-3, p-5, m-7 (must be 4px grid)
- `local-rules/stories-no-i18n-keys` — blocks i18n keys in Storybook (use direct labels)

**If lint fails, fix before commit!**

## Storybook + i18n

Stories run in isolation without real translations. Use direct `label` prop, not `labelKey`.

```tsx
// ❌ Bad — i18n keys don't resolve in Storybook
const item = { labelKey: 'sidebar.items.dashboard', label: 'Dashboard' }

// ✅ Good — direct value works everywhere
const item = { label: 'Dashboard' }
```

ESLint auto-fix removes redundant `labelKey` when `label` exists.

---

**Full guidelines:** `docs/design-system/README.md` | **Project rules:** `CLAUDE.md`
