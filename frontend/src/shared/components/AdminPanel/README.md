# AdminPanel Components

Admin Panel infrastructure for bulk operations and diagnostics.

## Components

### `<AdminPanel>`

Container component with toggle functionality.

**Usage:**
```tsx
import { AdminPanel } from '@/shared/components/AdminPanel'

<AdminPanel visible={isAdminMode} onToggle={() => setExpanded(!expanded)}>
  <p>Admin content here</p>
</AdminPanel>
```

### `<BulkActionsToolbar>`

Reusable toolbar for bulk operations with selection controls.

**Props:**
- `selectedCount: number` - Number of selected items
- `totalCount: number` - Total number of items
- `onSelectAll: () => void` - Handler for "Select All"
- `onClearSelection: () => void` - Handler for clearing selection
- `onApprove?: () => void` - Optional approve handler
- `onArchive?: () => void` - Optional archive handler
- `onDelete?: () => void` - Optional delete handler
- `className?: string` - Optional additional CSS classes

**Usage Example:**
```tsx
import { useState } from 'react'
import { BulkActionsToolbar } from '@/shared/components/AdminPanel'

const MyComponent = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const items = [...] // Your data

  return (
    <BulkActionsToolbar
      selectedCount={selectedIds.length}
      totalCount={items.length}
      onSelectAll={() => setSelectedIds(items.map(i => i.id))}
      onClearSelection={() => setSelectedIds([])}
      onApprove={() => approveItems(selectedIds)}
      onArchive={() => archiveItems(selectedIds)}
      onDelete={() => deleteItems(selectedIds)}
    />
  )
}
```

**Features:**
- Shows selected count ("5 selected")
- "Select All" checkbox with indeterminate state
- Action buttons: Approve, Archive, Delete, Clear
- Buttons only visible when items selected
- Amber theme matching Admin Panel
- Dark mode support
- Lucide icons

**Visual States:**
1. **No Selection**: Only checkbox + "Select all" label visible
2. **Partial Selection**: Checkbox indeterminate + "5 selected" + action buttons
3. **All Selected**: Checkbox checked + "10 selected" + action buttons

## Demo

To test the toolbar, import `BulkActionsToolbarDemo` in any page:

```tsx
import { BulkActionsToolbarDemo } from '@/shared/components/BulkActionsToolbarDemo'

// In your component:
<BulkActionsToolbarDemo />
```

## Integration Pattern

**Step 1: Add selection state**
```tsx
const [selectedIds, setSelectedIds] = useState<number[]>([])
```

**Step 2: Add checkbox to each row**
```tsx
<Checkbox
  checked={selectedIds.includes(item.id)}
  onCheckedChange={() => toggleSelection(item.id)}
/>
```

**Step 3: Add toolbar above list**
```tsx
<BulkActionsToolbar
  selectedCount={selectedIds.length}
  totalCount={items.length}
  onSelectAll={() => setSelectedIds(items.map(i => i.id))}
  onClearSelection={() => setSelectedIds([])}
  onApprove={handleApprove}
  onArchive={handleArchive}
  onDelete={handleDelete}
/>
```

## Testing

Run tests:
```bash
npm test -- BulkActionsToolbar.test.tsx
```

14 test cases covering:
- Selection states (none, partial, all)
- Action button visibility
- Callback invocations
- Accessibility attributes
- Custom className support
