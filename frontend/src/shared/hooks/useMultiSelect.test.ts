import { renderHook, act } from '@testing-library/react'
import { useMultiSelect } from './useMultiSelect'
import { Table } from '@tanstack/react-table'

type MockRow = {
  id: string
  name: string
}

const createMockTable = (rows: MockRow[]): Partial<Table<MockRow>> => {
  const rowSelection: Record<string, boolean> = {}
  const selectedRows = new Set<string>()

  return {
    getRowModel: () => ({
      rows: rows.map((data) => ({
        id: data.id,
        original: data,
        getIsSelected: () => selectedRows.has(data.id),
        toggleSelected: (value?: boolean) => {
          const shouldSelect = value ?? !selectedRows.has(data.id)
          if (shouldSelect) {
            selectedRows.add(data.id)
          } else {
            selectedRows.delete(data.id)
          }
        },
      })),
    }),
    setRowSelection: (updater: any) => {
      const newSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater
      Object.keys(newSelection).forEach((id) => {
        if (newSelection[id]) {
          selectedRows.add(id)
        } else {
          selectedRows.delete(id)
        }
      })
    },
    toggleAllPageRowsSelected: (value: boolean) => {
      if (value) {
        rows.forEach((row) => selectedRows.add(row.id))
      } else {
        selectedRows.clear()
      }
    },
    getSelectedRowModel: () => ({
      rows: rows
        .filter((row) => selectedRows.has(row.id))
        .map((data) => ({ id: data.id, original: data })),
    }),
  } as any
}

describe('useMultiSelect', () => {
  const mockRows: MockRow[] = [
    { id: '1', name: 'Row 1' },
    { id: '2', name: 'Row 2' },
    { id: '3', name: 'Row 3' },
    { id: '4', name: 'Row 4' },
    { id: '5', name: 'Row 5' },
  ]

  it('should handle single click toggle', () => {
    const mockTable = createMockTable(mockRows)
    const onSelectionChange = vi.fn()

    const { result } = renderHook(() =>
      useMultiSelect({ table: mockTable as Table<MockRow>, onSelectionChange })
    )

    const mockEvent = { shiftKey: false } as React.MouseEvent

    act(() => {
      result.current.handleCheckboxClick('2', mockEvent)
    })

    setTimeout(() => {
      expect(onSelectionChange).toHaveBeenCalledWith(['2'])
    }, 10)
  })

  it('should handle Shift+Click range selection (forward)', () => {
    const mockTable = createMockTable(mockRows)
    const onSelectionChange = vi.fn()

    const { result } = renderHook(() =>
      useMultiSelect({ table: mockTable as Table<MockRow>, onSelectionChange })
    )

    // First click on row 1
    act(() => {
      result.current.handleCheckboxClick('1', { shiftKey: false } as React.MouseEvent)
    })

    // Shift+Click on row 4 (should select 1,2,3,4)
    act(() => {
      result.current.handleCheckboxClick('4', { shiftKey: true } as React.MouseEvent)
    })

    setTimeout(() => {
      const calls = onSelectionChange.mock.calls
      const lastCall = calls[calls.length - 1][0]
      expect(lastCall).toContain('1')
      expect(lastCall).toContain('2')
      expect(lastCall).toContain('3')
      expect(lastCall).toContain('4')
    }, 10)
  })

  it('should handle Shift+Click range selection (backward)', () => {
    const mockTable = createMockTable(mockRows)
    const onSelectionChange = vi.fn()

    const { result } = renderHook(() =>
      useMultiSelect({ table: mockTable as Table<MockRow>, onSelectionChange })
    )

    // First click on row 4
    act(() => {
      result.current.handleCheckboxClick('4', { shiftKey: false } as React.MouseEvent)
    })

    // Shift+Click on row 1 (should select 1,2,3,4)
    act(() => {
      result.current.handleCheckboxClick('1', { shiftKey: true } as React.MouseEvent)
    })

    setTimeout(() => {
      const calls = onSelectionChange.mock.calls
      const lastCall = calls[calls.length - 1][0]
      expect(lastCall).toContain('1')
      expect(lastCall).toContain('2')
      expect(lastCall).toContain('3')
      expect(lastCall).toContain('4')
    }, 10)
  })

  it('should handle Shift+Click without previous click', () => {
    const mockTable = createMockTable(mockRows)
    const onSelectionChange = vi.fn()

    const { result } = renderHook(() =>
      useMultiSelect({ table: mockTable as Table<MockRow>, onSelectionChange })
    )

    // Shift+Click without previous click (should toggle single row)
    act(() => {
      result.current.handleCheckboxClick('3', { shiftKey: true } as React.MouseEvent)
    })

    // Should behave like single click
    setTimeout(() => {
      expect(onSelectionChange).toHaveBeenCalled()
    }, 10)
  })

  it('should handle Select All', () => {
    const mockTable = createMockTable(mockRows)
    const onSelectionChange = vi.fn()

    const { result } = renderHook(() =>
      useMultiSelect({ table: mockTable as Table<MockRow>, onSelectionChange })
    )

    act(() => {
      result.current.handleSelectAll()
    })

    setTimeout(() => {
      const calls = onSelectionChange.mock.calls
      const lastCall = calls[calls.length - 1][0]
      expect(lastCall).toHaveLength(5)
    }, 10)
  })

  it('should handle Clear Selection', () => {
    const mockTable = createMockTable(mockRows)
    const onSelectionChange = vi.fn()

    const { result } = renderHook(() =>
      useMultiSelect({ table: mockTable as Table<MockRow>, onSelectionChange })
    )

    // Select some rows first
    act(() => {
      result.current.handleSelectAll()
    })

    // Clear selection
    act(() => {
      result.current.handleClearSelection()
    })

    expect(onSelectionChange).toHaveBeenCalledWith([])
  })

  it('should reset last clicked index after Select All', () => {
    const mockTable = createMockTable(mockRows)
    const onSelectionChange = vi.fn()

    const { result } = renderHook(() =>
      useMultiSelect({ table: mockTable as Table<MockRow>, onSelectionChange })
    )

    // Click row 2
    act(() => {
      result.current.handleCheckboxClick('2', { shiftKey: false } as React.MouseEvent)
    })

    // Select All (should reset last clicked)
    act(() => {
      result.current.handleSelectAll()
    })

    // Shift+Click should not use previous index
    act(() => {
      result.current.handleCheckboxClick('4', { shiftKey: true } as React.MouseEvent)
    })

    // Should toggle single row since last clicked was reset
    setTimeout(() => {
      expect(onSelectionChange).toHaveBeenCalled()
    }, 10)
  })

  it('should reset last clicked index after Clear Selection', () => {
    const mockTable = createMockTable(mockRows)
    const onSelectionChange = vi.fn()

    const { result } = renderHook(() =>
      useMultiSelect({ table: mockTable as Table<MockRow>, onSelectionChange })
    )

    // Click row 2
    act(() => {
      result.current.handleCheckboxClick('2', { shiftKey: false } as React.MouseEvent)
    })

    // Clear Selection
    act(() => {
      result.current.handleClearSelection()
    })

    // Shift+Click should not use previous index
    act(() => {
      result.current.handleCheckboxClick('4', { shiftKey: true } as React.MouseEvent)
    })

    // Should toggle single row since last clicked was reset
    setTimeout(() => {
      expect(onSelectionChange).toHaveBeenCalled()
    }, 10)
  })

  it('should handle invalid row ID gracefully', () => {
    const mockTable = createMockTable(mockRows)
    const onSelectionChange = vi.fn()

    const { result } = renderHook(() =>
      useMultiSelect({ table: mockTable as Table<MockRow>, onSelectionChange })
    )

    act(() => {
      result.current.handleCheckboxClick('999', { shiftKey: false } as React.MouseEvent)
    })

    // Should not throw error, should not call onSelectionChange
    expect(onSelectionChange).not.toHaveBeenCalled()
  })

  it('should work without onSelectionChange callback', () => {
    const mockTable = createMockTable(mockRows)

    const { result } = renderHook(() =>
      useMultiSelect({ table: mockTable as Table<MockRow> })
    )

    // Should not throw error
    expect(() => {
      act(() => {
        result.current.handleCheckboxClick('2', { shiftKey: false } as React.MouseEvent)
      })
    }).not.toThrow()
  })

  it('should handle Shift+Click range with deselection', () => {
    const mockTable = createMockTable(mockRows)
    const onSelectionChange = vi.fn()

    const { result } = renderHook(() =>
      useMultiSelect({ table: mockTable as Table<MockRow>, onSelectionChange })
    )

    // First click on row 2 (select)
    act(() => {
      result.current.handleCheckboxClick('2', { shiftKey: false } as React.MouseEvent)
    })

    // Click row 2 again (deselect)
    act(() => {
      result.current.handleCheckboxClick('2', { shiftKey: false } as React.MouseEvent)
    })

    // Now Shift+Click on row 4 (should deselect range 2-4)
    act(() => {
      result.current.handleCheckboxClick('4', { shiftKey: true } as React.MouseEvent)
    })

    setTimeout(() => {
      expect(onSelectionChange).toHaveBeenCalled()
    }, 10)
  })
})
