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

    const event = new KeyboardEvent('keydown', {
      key: 'a',
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
        key: 'A',
        metaKey: true,
        shiftKey: true,
        callback,
      })
    )

    const event = new KeyboardEvent('keydown', {
      key: 'a',
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
      metaKey: true,
      shiftKey: true,
      ctrlKey: false,
    })

    window.dispatchEvent(event)

    expect(callback).not.toHaveBeenCalled()
  })
})
