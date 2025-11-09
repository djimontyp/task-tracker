# BulkActionsToolbar - Integration Guide

Quick reference for integrating `<BulkActionsToolbar>` into pages.

---

## 3-Step Integration

### Step 1: Add Selection State

```tsx
import { useState } from 'react'

const [selectedIds, setSelectedIds] = useState<number[]>([])
```

### Step 2: Add Checkboxes to Rows

```tsx
import { Checkbox } from '@/shared/ui/checkbox'

const handleToggleItem = (id: number) => {
  setSelectedIds(prev =>
    prev.includes(id)
      ? prev.filter(itemId => itemId !== id)
      : [...prev, id]
  )
}

// In your table row:
<Checkbox
  checked={selectedIds.includes(item.id)}
  onCheckedChange={() => handleToggleItem(item.id)}
  id={`item-${item.id}`}
/>
```

### Step 3: Add Toolbar Above Table

```tsx
import { BulkActionsToolbar } from '@/shared/components/AdminPanel'

<BulkActionsToolbar
  selectedCount={selectedIds.length}
  totalCount={items.length}
  onSelectAll={() => setSelectedIds(items.map(i => i.id))}
  onClearSelection={() => setSelectedIds([])}
  onApprove={() => handleApprove(selectedIds)}
  onArchive={() => handleArchive(selectedIds)}
  onDelete={() => handleDelete(selectedIds)}
/>
```

---

## Complete Example

```tsx
import { useState } from 'react'
import { BulkActionsToolbar } from '@/shared/components/AdminPanel'
import { Checkbox } from '@/shared/ui/checkbox'
import { Card } from '@/shared/ui/card'

interface Item {
  id: number
  title: string
}

export const MyPage = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const items: Item[] = [...] // Your data from API

  const handleToggleItem = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleApprove = async (ids: number[]) => {
    await approveItems(ids)
    setSelectedIds([])
  }

  const handleArchive = async (ids: number[]) => {
    await archiveItems(ids)
    setSelectedIds([])
  }

  const handleDelete = async (ids: number[]) => {
    if (confirm(`Delete ${ids.length} items?`)) {
      await deleteItems(ids)
      setSelectedIds([])
    }
  }

  return (
    <Card>
      <BulkActionsToolbar
        selectedCount={selectedIds.length}
        totalCount={items.length}
        onSelectAll={() => setSelectedIds(items.map(i => i.id))}
        onClearSelection={() => setSelectedIds([])}
        onApprove={() => handleApprove(selectedIds)}
        onArchive={() => handleArchive(selectedIds)}
        onDelete={() => handleDelete(selectedIds)}
      />

      <div className="p-6">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-3 border-b">
            <Checkbox
              checked={selectedIds.includes(item.id)}
              onCheckedChange={() => handleToggleItem(item.id)}
              id={`item-${item.id}`}
            />
            <label htmlFor={`item-${item.id}`} className="flex-1">
              {item.title}
            </label>
          </div>
        ))}
      </div>
    </Card>
  )
}
```

---

## API Mutations Example

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const queryClient = useQueryClient()

const approveMutation = useMutation({
  mutationFn: (ids: number[]) => apiClient.post('/items/approve', { ids }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] })
    toast.success('Items approved')
  },
})

const handleApprove = (ids: number[]) => {
  approveMutation.mutate(ids)
  setSelectedIds([])
}
```

---

## Optional Actions

You can omit actions you don't need:

```tsx
// Only Approve and Delete
<BulkActionsToolbar
  selectedCount={selectedIds.length}
  totalCount={items.length}
  onSelectAll={() => setSelectedIds(items.map(i => i.id))}
  onClearSelection={() => setSelectedIds([])}
  onApprove={handleApprove}
  onDelete={handleDelete}
  // onArchive omitted - button won't appear
/>
```

---

## Admin Panel Integration

Use inside `<AdminPanel>` for hidden admin features:

```tsx
import { useAdminMode } from '@/shared/hooks'
import { AdminPanel, BulkActionsToolbar } from '@/shared/components/AdminPanel'

export const MyPage = () => {
  const { isAdminMode } = useAdminMode()

  return (
    <div>
      {/* Consumer UI */}
      <ItemList items={items} />

      {/* Admin Panel with Bulk Operations */}
      <AdminPanel visible={isAdminMode}>
        <BulkActionsToolbar
          selectedCount={selectedIds.length}
          totalCount={items.length}
          onSelectAll={() => setSelectedIds(items.map(i => i.id))}
          onClearSelection={() => setSelectedIds([])}
          onApprove={handleApprove}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      </AdminPanel>
    </div>
  )
}
```

---

## Testing

```bash
# Manual testing with demo
# 1. Import BulkActionsToolbarDemo into any page
import { BulkActionsToolbarDemo } from '@/shared/components/BulkActionsToolbarDemo'

# 2. Add to component
<BulkActionsToolbarDemo />

# 3. Navigate to page and test all features
```

---

## Common Patterns

### Keyboard Shortcuts
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey && e.key === 'a') {
      e.preventDefault()
      setSelectedIds(items.map(i => i.id))
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [items])
```

### Persist Selection Across Pages
```tsx
import { create } from 'zustand'

const useSelectionStore = create<{
  selectedIds: number[]
  setSelectedIds: (ids: number[]) => void
}>((set) => ({
  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),
}))
```

### Optimistic Updates
```tsx
const approveMutation = useMutation({
  mutationFn: approveItems,
  onMutate: async (ids) => {
    await queryClient.cancelQueries({ queryKey: ['items'] })
    const previous = queryClient.getQueryData(['items'])
    queryClient.setQueryData(['items'], (old: Item[]) =>
      old.map(item => ids.includes(item.id) ? { ...item, approved: true } : item)
    )
    return { previous }
  },
  onError: (err, ids, context) => {
    queryClient.setQueryData(['items'], context.previous)
  },
})
```

---

## Troubleshooting

### Toolbar doesn't appear
- Check `selectedCount > 0`
- Verify action handlers provided (onApprove, onArchive, or onDelete)

### Checkbox doesn't toggle
- Ensure `onCheckedChange` callback updates state
- Check checkbox `checked` prop receives correct boolean

### Indeterminate state not working
- Verify `selectedCount > 0 && selectedCount < totalCount`
- Radix Checkbox handles indeterminate automatically

---

## Next Steps

After integration:
1. Test all 3 states (none, partial, all selected)
2. Verify action handlers trigger API calls
3. Check loading/error states
4. Test keyboard accessibility (Tab, Space, Enter)
5. Verify dark mode styling
