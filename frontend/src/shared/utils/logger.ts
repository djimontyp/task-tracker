/**
 * Simple logger utility that respects NODE_ENV
 * Debug logs are only shown in development mode
 */

const IS_DEV = process.env.NODE_ENV === 'development'

export const logger = {
  debug: (...args: unknown[]) => {
    if (IS_DEV) {
      console.log('[DEBUG]', ...args)
    }
  },
  info: (...args: unknown[]) => {
    console.log('[INFO]', ...args)
  },
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args)
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args)
  },
}
