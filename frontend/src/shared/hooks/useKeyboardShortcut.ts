import { useEffect } from 'react'

interface UseKeyboardShortcutOptions {
  /**
   * Key to match. Can be:
   * - Physical key code (e.g., 'KeyB', 'Slash') - works on any keyboard layout (recommended)
   * - Key value (e.g., 'b', '/') - depends on current keyboard layout
   */
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  callback: () => void
  disabled?: boolean
}

/**
 * Maps common key values to their physical key codes for layout-independent matching.
 * Only includes keys that are typically used as shortcuts.
 */
const KEY_TO_CODE_MAP: Record<string, string> = {
  'a': 'KeyA', 'b': 'KeyB', 'c': 'KeyC', 'd': 'KeyD', 'e': 'KeyE',
  'f': 'KeyF', 'g': 'KeyG', 'h': 'KeyH', 'i': 'KeyI', 'j': 'KeyJ',
  'k': 'KeyK', 'l': 'KeyL', 'm': 'KeyM', 'n': 'KeyN', 'o': 'KeyO',
  'p': 'KeyP', 'q': 'KeyQ', 'r': 'KeyR', 's': 'KeyS', 't': 'KeyT',
  'u': 'KeyU', 'v': 'KeyV', 'w': 'KeyW', 'x': 'KeyX', 'y': 'KeyY',
  'z': 'KeyZ', '/': 'Slash', '\\': 'Backslash', '[': 'BracketLeft',
  ']': 'BracketRight', ';': 'Semicolon', "'": 'Quote', ',': 'Comma',
  '.': 'Period', '`': 'Backquote', '-': 'Minus', '=': 'Equal',
}

export const useKeyboardShortcut = ({
  key,
  ctrlKey = false,
  shiftKey = false,
  metaKey = false,
  callback,
  disabled = false,
}: UseKeyboardShortcutOptions) => {
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const modifiersMatch =
        event.ctrlKey === ctrlKey &&
        event.shiftKey === shiftKey &&
        event.metaKey === metaKey

      // Try to match by physical key code first (layout-independent)
      // Fall back to event.key for special keys (Enter, Escape, etc.)
      const expectedCode = KEY_TO_CODE_MAP[key.toLowerCase()]
      const keyMatches = expectedCode
        ? event.code === expectedCode
        : event.key.toLowerCase() === key.toLowerCase()

      if (modifiersMatch && keyMatches) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, ctrlKey, shiftKey, metaKey, callback, disabled])
}
