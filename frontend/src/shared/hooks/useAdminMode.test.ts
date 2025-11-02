/**
 * Test suite for useAdminMode hook
 *
 * NOTE: Now uses Zustand store with persist middleware.
 * State is persisted to localStorage under 'ui-settings' key.
 *
 * To run tests:
 * Install: npm install -D vitest jsdom @vitest/ui
 * Add to vite.config.ts:
 *
 * test: {
 *   globals: true,
 *   environment: 'jsdom',
 *   setupFiles: './src/setupTests.ts',
 * }
 */

import { renderHook, act } from '@testing-library/react'
import { useAdminMode } from './useAdminMode'
import { useUiStore } from '@/shared/store/uiStore'

describe('useAdminMode', () => {
  beforeEach(() => {
    localStorage.clear()
    useUiStore.setState({ isAdminMode: false })
  })

  it('should initialize with false by default', () => {
    const { result } = renderHook(() => useAdminMode())
    expect(result.current.isAdminMode).toBe(false)
  })

  it('should toggle admin mode', () => {
    const { result } = renderHook(() => useAdminMode())

    act(() => {
      result.current.toggleAdminMode()
    })

    expect(result.current.isAdminMode).toBe(true)
  })

  it('should enable admin mode explicitly', () => {
    const { result } = renderHook(() => useAdminMode())

    act(() => {
      result.current.enableAdminMode()
    })

    expect(result.current.isAdminMode).toBe(true)
  })

  it('should disable admin mode explicitly', () => {
    const { result } = renderHook(() => useAdminMode())

    act(() => {
      result.current.enableAdminMode()
    })

    expect(result.current.isAdminMode).toBe(true)

    act(() => {
      result.current.disableAdminMode()
    })

    expect(result.current.isAdminMode).toBe(false)
  })

  it('should persist state via Zustand persist middleware', () => {
    const { result } = renderHook(() => useAdminMode())

    act(() => {
      result.current.enableAdminMode()
    })

    const stored = localStorage.getItem('ui-settings')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.state.isAdminMode).toBe(true)
  })

  it('should read from persisted state on mount', () => {
    const mockState = {
      state: {
        isAdminMode: true,
        theme: 'system',
        sidebarOpen: true,
      },
      version: 0,
    }
    localStorage.setItem('ui-settings', JSON.stringify(mockState))

    useUiStore.persist.rehydrate()

    const { result } = renderHook(() => useAdminMode())
    expect(result.current.isAdminMode).toBe(true)
  })

  it('should toggle multiple times correctly', () => {
    const { result } = renderHook(() => useAdminMode())

    act(() => {
      result.current.toggleAdminMode()
    })
    expect(result.current.isAdminMode).toBe(true)

    act(() => {
      result.current.toggleAdminMode()
    })
    expect(result.current.isAdminMode).toBe(false)

    act(() => {
      result.current.toggleAdminMode()
    })
    expect(result.current.isAdminMode).toBe(true)
  })

  it('should sync state across multiple hook instances', () => {
    const { result: result1 } = renderHook(() => useAdminMode())
    const { result: result2 } = renderHook(() => useAdminMode())

    expect(result1.current.isAdminMode).toBe(false)
    expect(result2.current.isAdminMode).toBe(false)

    act(() => {
      result1.current.toggleAdminMode()
    })

    expect(result1.current.isAdminMode).toBe(true)
    expect(result2.current.isAdminMode).toBe(true)
  })
})
