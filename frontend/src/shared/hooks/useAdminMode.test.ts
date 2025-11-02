/**
 * Test suite for useAdminMode hook
 *
 * NOTE: To run these tests, Vitest needs to be configured.
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

describe('useAdminMode', () => {
  beforeEach(() => {
    localStorage.clear()
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
    localStorage.setItem('taskTracker_adminMode', 'true')
    const { result } = renderHook(() => useAdminMode())

    expect(result.current.isAdminMode).toBe(true)

    act(() => {
      result.current.disableAdminMode()
    })

    expect(result.current.isAdminMode).toBe(false)
  })

  it('should persist state to localStorage', () => {
    const { result } = renderHook(() => useAdminMode())

    act(() => {
      result.current.enableAdminMode()
    })

    expect(localStorage.getItem('taskTracker_adminMode')).toBe('true')
  })

  it('should read from localStorage on mount', () => {
    localStorage.setItem('taskTracker_adminMode', 'true')

    const { result } = renderHook(() => useAdminMode())
    expect(result.current.isAdminMode).toBe(true)
  })

  it('should persist false state to localStorage', () => {
    localStorage.setItem('taskTracker_adminMode', 'true')
    const { result } = renderHook(() => useAdminMode())

    act(() => {
      result.current.disableAdminMode()
    })

    expect(localStorage.getItem('taskTracker_adminMode')).toBe('false')
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
})
