# Badge Component

## Purpose

Display labels, tags, statuses, and semantic type indicators.

## Variants

| Variant | Background | Text | Use |
|---------|-----------|------|-----|
| **default** | Gray | Dark | Neutral labels, tags |
| **secondary** | Light gray | Dark | Less important tags |
| **outline** | Transparent | Color + border | Tags, filters |
| **destructive** | Red | White | Error, delete, rejected |

## Semantic Colors

| Color Token | Use | Example |
|-------------|-----|---------|
| `bg-atom-problem` | Problem badge | Bugs, errors, issues |
| `bg-atom-solution` | Solution badge | Fixes, implementations |
| `bg-atom-decision` | Decision badge | Architecture decisions |
| `bg-atom-question` | Question badge | Open questions |
| `bg-atom-insight` | Insight badge | Learnings, patterns |
| `bg-status-connected` | Success status | Connected, approved |
| `bg-status-pending` | Warning status | Pending, validating |
| `bg-status-error` | Error status | Error, offline |

## Sizes

| Size | Font | Padding | Use |
|------|------|---------|-----|
| **sm** | 11px | 4px 8px | Inline labels |
| **default** | 12px | 6px 10px | Standard badge |
| **lg** | 13px | 8px 12px | Standalone badge |

## States

### Default (Resting)

```jsx
<Badge>LABEL</Badge>
<Badge variant="outline">Tag</Badge>
```

**Visual:**
- Solid background (semantic color)
- Rounded pill (border-radius-full)
- Bold text (600 weight)
- No interaction

### With Icon

```jsx
<Badge className="flex items-center gap-1">
  <CheckCircle className="h-3 w-3" />
  APPROVED
</Badge>
```

**Visual:**
- Icon: 12px, same color as text
- Gap: 4px between icon and text
- Content: Icon + text together

## Usage Examples

### Atom Type Badges

```jsx
const atomTypeColors: Record<AtomType, string> = {
  problem: 'bg-atom-problem text-white',
  solution: 'bg-atom-solution text-white',
  decision: 'bg-atom-decision text-white',
  question: 'bg-atom-question text-white',
  insight: 'bg-atom-insight text-white',
  pattern: 'bg-atom-pattern text-white',
  requirement: 'bg-atom-requirement text-white',
}

// Usage
<Badge className={atomTypeColors[atom.type]}>
  {atomTypeLabels[atom.type]}
</Badge>
```

### Status Badges

```jsx
{/* Connected */}
<Badge className="bg-status-connected text-white">
  CONNECTED
</Badge>

{/* Pending */}
<Badge className="bg-status-pending text-white">
  PENDING
</Badge>

{/* Error */}
<Badge className="bg-status-error text-white">
  ERROR
</Badge>
```

### Tag Badges (Outline Style)

```jsx
<div className="flex gap-1 flex-wrap">
  {tags.map(tag => (
    <Badge key={tag.id} variant="outline">
      {tag.name}
    </Badge>
  ))}
</div>
```

### Badge with Close Button

```jsx
<Badge className="flex items-center gap-1 pl-2 pr-1">
  <span>Tag Name</span>
  <button
    onClick={() => removeTag(tag.id)}
    className="rounded hover:bg-black/10 p-0.5 ml-0.5"
    aria-label={`Remove ${tag.name}`}
  >
    <X className="h-3 w-3" />
  </button>
</Badge>
```

### Count Badge (Notification)

```jsx
<div className="relative inline-block">
  <Button size="icon">
    <Bell />
  </Button>
  {count > 0 && (
    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
      {count}
    </Badge>
  )}
</div>
```

### Message Filter Tags

```jsx
<div className="flex gap-2 flex-wrap">
  {filters.map(filter => (
    <Badge
      key={filter.id}
      variant={activeFilter === filter.id ? 'default' : 'outline'}
      className="cursor-pointer"
      onClick={() => setActiveFilter(filter.id)}
    >
      {filter.label}
      {filter.count && (
        <span className="ml-1 text-xs opacity-70">({filter.count})</span>
      )}
    </Badge>
  ))}
</div>
```

## Accessibility Requirements

- [ ] **Color + Text** — Never color alone (always pair with label)
- [ ] **Sufficient contrast** — Text ≥4.5:1 on background
- [ ] **Readable text** — Never smaller than 11px (xs)
- [ ] **Icon support** — Optional icon paired with text

### Example: Accessible Status Badge

```jsx
// ✅ CORRECT — Color + icon + text
<Badge className="bg-status-connected text-white flex items-center gap-1">
  <CheckCircle className="h-3 w-3" />
  Connected
</Badge>

// ❌ WRONG — Color only
<Badge className="bg-green-500 w-3 h-3" />

// ⚠️ WRONG — Icon only
<Badge className="bg-green-500">
  <CheckCircle />
</Badge>
```

## Do's and Don'ts

### Do's ✅

- **Do** use semantic colors (atom-problem, status-connected)
- **Do** pair color with text
- **Do** keep text short (1-3 words)
- **Do** use uppercase for type labels (PROBLEM, SOLUTION)
- **Do** use outline variant for filters/tags
- **Do** include icons for additional clarity
- **Do** test contrast on light and dark backgrounds

### Don'ts ❌

- **Don't** use only color to indicate status
- **Don't** use hardcoded color values (use semantic tokens)
- **Don't** exceed 20px height (too bulky)
- **Don't** use badges for interactive elements (use buttons)
- **Don't** nest multiple elements inside badge
- **Don't** use very small icons (<12px) without text
- **Don't** use badges as main navigation

## Code Examples

### Atom Type Badge Set

```jsx
interface AtomBadgeProps {
  type: AtomType
  confident?: boolean
}

export function AtomBadge({ type, confident }: AtomBadgeProps) {
  const atomTypeColors: Record<AtomType, string> = {
    problem: 'bg-atom-problem text-white',
    solution: 'bg-atom-solution text-white',
    decision: 'bg-atom-decision text-white',
    question: 'bg-atom-question text-white',
    insight: 'bg-atom-insight text-white',
    pattern: 'bg-atom-pattern text-white',
    requirement: 'bg-atom-requirement text-white',
  }

  const labels: Record<AtomType, string> = {
    problem: 'Problem',
    solution: 'Solution',
    decision: 'Decision',
    question: 'Question',
    insight: 'Insight',
    pattern: 'Pattern',
    requirement: 'Requirement',
  }

  return (
    <Badge className={cn(
      'text-xs font-semibold px-2 py-1',
      atomTypeColors[type]
    )}>
      {labels[type]}
      {confident && <span className="ml-1">✓</span>}
    </Badge>
  )
}
```

### Status Badge with Indicator

```jsx
interface StatusBadgeProps {
  status: 'connected' | 'validating' | 'pending' | 'error'
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const statusConfig = {
    connected: {
      color: 'bg-status-connected',
      icon: CheckCircle,
      defaultLabel: 'Connected'
    },
    validating: {
      color: 'bg-status-validating',
      icon: Clock,
      defaultLabel: 'Validating'
    },
    pending: {
      color: 'bg-status-pending',
      icon: AlertCircle,
      defaultLabel: 'Pending'
    },
    error: {
      color: 'bg-status-error',
      icon: XCircle,
      defaultLabel: 'Error'
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge className={cn('text-white flex items-center gap-1', config.color)}>
      <Icon className="h-3 w-3" />
      {label || config.defaultLabel}
    </Badge>
  )
}
```

### Tag Badge with Remove

```jsx
interface TagBadgeProps {
  label: string
  onRemove?: () => void
  selectable?: boolean
  selected?: boolean
}

export function TagBadge({ label, onRemove, selectable, selected }: TagBadgeProps) {
  return (
    <Badge
      variant={selected ? 'default' : 'outline'}
      className={cn(
        'cursor-pointer gap-1',
        selectable && 'hover:bg-accent'
      )}
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="rounded hover:bg-black/10 dark:hover:bg-white/10 p-0.5 ml-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  )
}
```

## Component Props

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
  size?: 'sm' | 'default' | 'lg'
  children?: React.ReactNode
  className?: string
}
```

---

## Specification Summary

| Property | Value |
|----------|-------|
| **Component** | `<Badge>` |
| **Location** | `frontend/src/shared/ui/badge.tsx` |
| **Variants** | 4 (default, secondary, outline, destructive) |
| **Sizes** | 3 (sm, default, lg) |
| **Font** | Inter, semibold (600) |
| **Default Font Size** | 12px (text-xs) |
| **Border Radius** | 4px (rounded-md) |
| **Padding** | 6px 10px (default) |
| **Display** | `inline-flex` |
| **Color Support** | CSS variables (auto light/dark) |
| **Interactive** | No (use Button for interactive) |
| **Icons** | 12px, optional |

