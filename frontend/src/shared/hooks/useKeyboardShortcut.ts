import { useEffect } from 'react'

interface UseKeyboardShortcutOptions {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  callback: () => void
  disabled?: boolean
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

      const keyMatches = event.key.toLowerCase() === key.toLowerCase()

      if (modifiersMatch && keyMatches) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, ctrlKey, shiftKey, metaKey, callback, disabled])
}
