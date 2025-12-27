/**
 * WebSocket URL utilities
 *
 * Builds WebSocket URL dynamically based on current origin.
 * Works with localhost, ngrok, and any other host.
 */

const DEFAULT_WS_PATH = '/ws'

/**
 * Get WebSocket URL for the current origin
 * Falls back to env variable if set, otherwise uses current window.location
 */
export function getWebSocketUrl(topics?: string[]): string {
  // If explicit WS URL is set in env, use it
  const envUrl = import.meta.env.VITE_WS_URL?.trim()
  if (envUrl) {
    let url = envUrl
    if (topics && topics.length > 0) {
      url += `?topics=${topics.join(',')}`
    }
    return url
  }

  // Build URL from current origin
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = window.location.host // includes port if present

  let url = `${protocol}://${host}${DEFAULT_WS_PATH}`

  if (topics && topics.length > 0) {
    url += `?topics=${topics.join(',')}`
  }

  return url
}
