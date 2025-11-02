/**
 * Demo component to verify BulkActionsToolbar functionality
 * Can be used for manual browser testing
 * Import in any page temporarily to test
 */

import { useState } from 'react'
import { Card } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { BulkActionsToolbar } from './AdminPanel'

interface MockItem {
  id: number
  title: string
}

const MOCK_ITEMS: MockItem[] = [
  { id: 1, title: 'Task 1: Implement authentication' },
  { id: 2, title: 'Task 2: Create dashboard' },
  { id: 3, title: 'Task 3: Add notifications' },
  { id: 4, title: 'Task 4: Optimize performance' },
  { id: 5, title: 'Task 5: Write documentation' },
]

export const BulkActionsToolbarDemo = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const handleSelectAll = () => {
    setSelectedIds(MOCK_ITEMS.map((item) => item.id))
  }

  const handleClearSelection = () => {
    setSelectedIds([])
  }

  const handleToggleItem = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    )
  }

  const handleApprove = () => {
    alert(`Approving items: ${selectedIds.join(', ')}`)
  }

  const handleArchive = () => {
    alert(`Archiving items: ${selectedIds.join(', ')}`)
  }

  const handleDelete = () => {
    if (confirm(`Delete ${selectedIds.length} items?`)) {
      alert(`Deleting items: ${selectedIds.join(', ')}`)
    }
  }

  return (
    <Card className="max-w-3xl">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">BulkActionsToolbar Demo</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Select items to see the toolbar in action
        </p>
      </div>

      <BulkActionsToolbar
        selectedCount={selectedIds.length}
        totalCount={MOCK_ITEMS.length}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onApprove={handleApprove}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />

      <div className="p-6">
        <div className="space-y-3">
          {MOCK_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 border rounded hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedIds.includes(item.id)}
                onCheckedChange={() => handleToggleItem(item.id)}
                id={`item-${item.id}`}
              />
              <label
                htmlFor={`item-${item.id}`}
                className="flex-1 cursor-pointer select-none"
              >
                {item.title}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 pt-0">
        <div className="p-4 bg-muted rounded text-xs space-y-1">
          <p className="font-medium">Test scenarios:</p>
          <p>1. Click individual checkboxes to select items</p>
          <p>2. Use "Select all" checkbox to select/deselect all</p>
          <p>3. Verify indeterminate state (partial selection)</p>
          <p>4. Click action buttons (Approve, Archive, Delete)</p>
          <p>5. Verify buttons only appear when items selected</p>
          <p>6. Test dark mode compatibility</p>
        </div>
      </div>
    </Card>
  )
}
