import { renderHook } from '@testing-library/react'
import { useKeyboardShortcut } from './useKeyboardShortcut'

describe('useKeyboardShortcut', () => {
  it('should call callback when correct keys pressed', () => {
    const callback = vi.fn()

    renderHook(() =>
      useKeyboardShortcut({
        key: 'a',
        metaKey: true,
        shiftKey: true,
        callback,
      })
    )

    // Include `code` for layout-independent matching
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'KeyA',
      metaKey: true,
      shiftKey: true,
      ctrlKey: false,
    })

    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should not call callback when incorrect key pressed', () => {
    const callback = vi.fn()

    renderHook(() =>
      useKeyboardShortcut({
        key: 'a',
        metaKey: true,
        shiftKey: true,
        callback,
      })
    )

    const event = new KeyboardEvent('keydown', {
      key: 'b',
      code: 'KeyB',
      metaKey: true,
      shiftKey: true,
      ctrlKey: false,
    })

    window.dispatchEvent(event)

    expect(callback).not.toHaveBeenCalled()
  })

  it('should not call callback when incorrect modifiers pressed', () => {
    const callback = vi.fn()

    renderHook(() =>
      useKeyboardShortcut({
        key: 'a',
        metaKey: true,
        shiftKey: true,
        callback,
      })
    )

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'KeyA',
      metaKey: false,
      shiftKey: true,
      ctrlKey: false,
    })

    window.dispatchEvent(event)

    expect(callback).not.toHaveBeenCalled()
  })

  it('should not call callback when disabled', () => {
    const callback = vi.fn()

    renderHook(() =>
      useKeyboardShortcut({
        key: 'a',
        metaKey: true,
        shiftKey: true,
        callback,
        disabled: true,
      })
    )

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'KeyA',
      metaKey: true,
      shiftKey: true,
      ctrlKey: false,
    })

    window.dispatchEvent(event)

    expect(callback).not.toHaveBeenCalled()
  })

  it('should handle case-insensitive key matching', () => {
    const callback = vi.fn()

    renderHook(() =>
      useKeyboardShortcut({
        key: 'A', // Uppercase in config
        metaKey: true,
        shiftKey: true,
        callback,
      })
    )

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'KeyA', // Code is always the same regardless of case
      metaKey: true,
      shiftKey: true,
      ctrlKey: false,
    })

    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should work with Ctrl key', () => {
    const callback = vi.fn()

    renderHook(() =>
      useKeyboardShortcut({
        key: 's',
        ctrlKey: true,
        callback,
      })
    )

    const event = new KeyboardEvent('keydown', {
      key: 's',
      code: 'KeyS',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
    })

    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should work with multiple modifiers', () => {
    const callback = vi.fn()

    renderHook(() =>
      useKeyboardShortcut({
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        callback,
      })
    )

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      code: 'KeyZ',
      ctrlKey: true,
      shiftKey: true,
      metaKey: false,
    })

    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should cleanup event listener on unmount', () => {
    const callback = vi.fn()

    const { unmount } = renderHook(() =>
      useKeyboardShortcut({
        key: 'a',
        metaKey: true,
        shiftKey: true,
        callback,
      })
    )

    unmount()

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'KeyA',
      metaKey: true,
      shiftKey: true,
      ctrlKey: false,
    })

    window.dispatchEvent(event)

    expect(callback).not.toHaveBeenCalled()
  })

  it('should work with slash key for search shortcut', () => {
    const callback = vi.fn()

    renderHook(() =>
      useKeyboardShortcut({
        key: '/',
        callback,
      })
    )

    const event = new KeyboardEvent('keydown', {
      key: '/',
      code: 'Slash',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
    })

    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should work with special keys like Escape (fallback to event.key)', () => {
    const callback = vi.fn()

    renderHook(() =>
      useKeyboardShortcut({
        key: 'Escape',
        callback,
      })
    )

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
    })

    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledTimes(1)
  })
})
