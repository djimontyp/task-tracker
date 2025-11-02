import { useCallback, useRef } from 'react'
import { Table } from '@tanstack/react-table'

export interface UseMultiSelectOptions<TData> {
  table: Table<TData>
  onSelectionChange?: (selectedIds: string[]) => void
}

export interface UseMultiSelectReturn {
  handleCheckboxClick: (rowId: string, event: React.MouseEvent) => void
  handleSelectAll: () => void
  handleClearSelection: () => void
}

/**
 * Hook for Gmail/Slack-style multi-select with Shift+Click range selection
 */
export function useMultiSelect<TData>({
  table,
  onSelectionChange,
}: UseMultiSelectOptions<TData>): UseMultiSelectReturn {
  const lastClickedIndexRef = useRef<number | null>(null)

  const handleCheckboxClick = useCallback(
    (rowId: string, event: React.MouseEvent) => {
      const rows = table.getRowModel().rows
      const currentIndex = rows.findIndex((r) => r.id === rowId)

      if (currentIndex === -1) return

      const row = rows[currentIndex]

      if (event.shiftKey && lastClickedIndexRef.current !== null) {
        // Shift+Click: Select range
        const startIndex = Math.min(lastClickedIndexRef.current, currentIndex)
        const endIndex = Math.max(lastClickedIndexRef.current, currentIndex)

        // Determine selection state from current row
        const targetState = !row.getIsSelected()

        // Apply to range
        const newSelection: Record<string, boolean> = {}
        for (let i = startIndex; i <= endIndex; i++) {
          newSelection[rows[i].id] = targetState
        }

        table.setRowSelection((prev) => ({
          ...prev,
          ...newSelection,
        }))
      } else {
        // Single click: Toggle individual
        row.toggleSelected()
      }

      lastClickedIndexRef.current = currentIndex

      if (onSelectionChange) {
        setTimeout(() => {
          const selectedIds = table
            .getSelectedRowModel()
            .rows.map((r) => r.id)
          onSelectionChange(selectedIds)
        }, 0)
      }
    },
    [table, onSelectionChange]
  )

  const handleSelectAll = useCallback(() => {
    table.toggleAllPageRowsSelected(true)
    lastClickedIndexRef.current = null

    if (onSelectionChange) {
      setTimeout(() => {
        const selectedIds = table
          .getSelectedRowModel()
          .rows.map((r) => r.id)
        onSelectionChange(selectedIds)
      }, 0)
    }
  }, [table, onSelectionChange])

  const handleClearSelection = useCallback(() => {
    table.toggleAllPageRowsSelected(false)
    lastClickedIndexRef.current = null

    if (onSelectionChange) {
      onSelectionChange([])
    }
  }, [table, onSelectionChange])

  return {
    handleCheckboxClick,
    handleSelectAll,
    handleClearSelection,
  }
}
